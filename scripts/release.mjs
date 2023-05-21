import minimist from 'minimist'
import fs, { readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import semver from 'semver'
import enquirer from 'enquirer'
import execa from 'execa'
import pSeries from 'p-series'

const { prompt } = enquirer

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const args = minimist(process.argv.slice(2))
let {
  skipBuild,
  tag: optionTag,
  dry: isDryRun,
  skipCleanCheck: skipCleanGitCheck,
} = args

const EXPECTED_BRANCH = 'v1'

/**
 * @param bin {string}
 * @param args {string[]}
 * @param opts {import('execa').CommonOptions<string>}
 */
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
/**
 * @param bin {string}
 * @param args {string[]}
 * @param opts {import('execa').CommonOptions<string>}
 */
const dryRun = async (bin, args, opts = {}) =>
  console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)
const runIfNotDry = isDryRun ? dryRun : run

const step = msg => console.log(chalk.cyan(msg))

async function main() {
  // git仓库检查
  if (skipCleanGitCheck) console.log(chalk.bold.white(`Skipping git checks...`))
  else {
    const isDirtyGit = !!(
      await run('git', ['status', '--porcelain'], { stdio: 'pipe' })
    ).stdout

    if (isDirtyGit) {
      console.log(chalk.red(`Git仓库未清空`))
      return
    }

    const currentBranch = (
      await run('git', ['branch', '--show-current'], { stdio: 'pipe' })
    ).stdout

    if (currentBranch !== EXPECTED_BRANCH) {
      console.log(
        chalk.red(
          `你应该在${chalk.green(EXPECTED_BRANCH)}分支而不是${chalk.green(
            currentBranch
          )}分支上发布.`
        )
      )
      return
    }
  }

  // git分支检查
  if (!skipCleanGitCheck) {
    const isOutdatedRE = new RegExp(
      `\\W${EXPECTED_BRANCH}\\W.*(?:fast-forwardable|local out of date)`,
      'i'
    )

    const isOutdatedGit = isOutdatedRE.test(
      (await run('git', ['remote', 'show', 'origin'], { stdio: 'pipe' })).stdout
    )

    if (isOutdatedGit) {
      console.log(chalk.red(`Git分支已过时`))
      return
    }
  }

  // diff检查
  const changedPackages = await getChangedPackages()
  if (!changedPackages.length) {
    console.log(chalk.red(`没有发现变更的包`))
    return
  }

  if (isDryRun) {
    console.log('\n' + chalk.bold.blue('本次为空运行') + '\n')
  }

  const packagesToRelease = changedPackages.slice()

  step(
    `准备发布包：${packagesToRelease
      .map(({ name }) => chalk.bold.white(name))
      .join(', ')}`
  )

  // 更新包的版本号
  const pkgWithVersions = await pSeries(
    packagesToRelease.map(({ name, version, path, pkg }) => async () => {
      const prerelease = semver.prerelease(version)
      const preId = prerelease?.[0]?.toString()

      /** @type {semver.ReleaseType[]} */
      const versionIncrements = [
        'patch',
        'minor',
        'major',
        // @ts-ignore
        ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] : []),
      ]

      // @ts-ignore
      const { release } = await prompt({
        type: 'select',
        name: 'release',
        message: `选择包${chalk.bold.white(name)}的发布类型`,
        choices: versionIncrements
          .map(i => `${i}: ${name} (${semver.inc(version, i, preId)})`)
          .concat(['custom']),
      })

      if (release === 'custom') {
        // @ts-ignore
        const { version: _version } = await prompt({
          type: 'input',
          name: 'version',
          message: `输入当前版本号(${chalk.bold.white(name)})`,
          initial: version,
        })
        version = _version
      } else {
        version = release.match(/\((.*)\)/)[1]
      }

      if (!semver.valid(version)) {
        throw new Error(`当前版本号不合法: ${version}`)
      }

      return { name, path, version, pkg }
    })
  )

  // 核对确认包的版本号
  // @ts-ignore
  const { yes: isReleaseConfirmed } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `正在发布：\n${pkgWithVersions
      .map(
        ({ name, version }) =>
          `  · ${chalk.white(name)}: ${chalk.yellow.bold('v' + version)}`
      )
      .join('\n')}\n确认？`,
  })
  if (!isReleaseConfirmed) {
    return
  }

  step('\n正在更新package.json文件中的版本号')
  await updateVersions(pkgWithVersions)

  step('\n更新lock文件')
  await runIfNotDry(`pnpm`, ['install'])

  // step('\n生成更新日志')
  // for (const pkg of pkgWithVersions) {
  //   step(` -> ${pkg.name} (${pkg.path})`)
  //   await runIfNotDry(`pnpm`, ['run', 'changelog'], { cwd: pkg.path })
  //   await runIfNotDry(`pnpm`, ['exec', 'prettier', '--write', 'CHANGELOG.md'], {
  //     cwd: pkg.path,
  //   })
  //   await fs.copyFile(
  //     resolve(__dirname, '../LICENSE'),
  //     resolve(pkg.path, 'LICENSE')
  //   )
  // }

  // 核对确认更新日志
  // @ts-ignore
  const { yes: isChangelogCorrect } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: '更新日志是否正确？',
  })
  if (!isChangelogCorrect) {
    return
  }

  step('\n正在打包所有包')
  if (!skipBuild && !isDryRun) {
    await run('pnpm', ['run', 'build'])
    await run('pnpm', ['run', 'build:dts'])
  } else {
    console.log(`(skipped)`)
  }

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\n更改提交文件中')
    await runIfNotDry('git', [
      'add',
      'packages/*/CHANGELOG.md',
      'packages/*/package.json',
      'pnpm-lock.yaml',
    ])
    await runIfNotDry('git', [
      'commit',
      '-m',
      `release: ${pkgWithVersions
        .map(({ name, version }) => `${name}@${version}`)
        .join(' ')}`,
    ])
  } else {
    console.log('No changes to commit.')
  }

  step('\n创建Tags中')
  let versionsToPush = []
  for (const pkg of pkgWithVersions) {
    versionsToPush.push(`refs/tags/${pkg.name}@${pkg.version}`)
    await runIfNotDry('git', ['tag', `${pkg.name}@${pkg.version}`])
  }

  step('\n正在发布所有包')
  for (const pkg of pkgWithVersions) {
    await publishPackage(pkg)
  }

  step('\n推送到GitHub中')
  await runIfNotDry('git', ['push', 'origin', ...versionsToPush])
  await runIfNotDry('git', ['push'])
}

/**
 *
 * @param packageList {{ name: string; path: string; version: string, pkg: any }[]}
 */
async function updateVersions(packageList) {
  return Promise.all(
    packageList.map(({ pkg, version, path, name }) => {
      pkg.version = version
      updateDeps(pkg, 'dependencies', packageList)
      updateDeps(pkg, 'peerDependencies', packageList)
      const content = JSON.stringify(pkg, null, 2) + '\n'
      return isDryRun
        ? dryRun('write', [name], {
            // @ts-ignore
            dependencies: pkg.dependencies,
            peerDependencies: pkg.peerDependencies,
          })
        : fs.writeFile(join(path, 'package.json'), content)
    })
  )
}

function updateDeps(pkg, depType, updatedPackages) {
  const deps = pkg[depType]
  if (!deps) return
  step(`正在更新${chalk.bold.white(pkg.name)}的${chalk.bold(depType)}`)
  Object.keys(deps).forEach(dep => {
    const updatedDep = updatedPackages.find(pkg => pkg.name === dep)
    // avoid updated peer deps that are external like @vue/devtools-api
    if (dep && updatedDep) {
      console.log(
        chalk.yellow(
          `${pkg.name} -> ${depType} -> ${dep}@~${updatedDep.version}`
        )
      )
      deps[dep] = '>=' + updatedDep.version
    }
  })
}

async function publishPackage(pkg) {
  step(`发布包${chalk.white(pkg.name)}中`)

  try {
    await runIfNotDry(
      'pnpm',
      [
        'publish',
        ...(optionTag ? ['--tag', optionTag] : []),
        ...(skipCleanGitCheck ? ['--no-git-checks'] : []),
        '--access',
        'public',
        // specific to pinia
        '--publish-branch',
        EXPECTED_BRANCH,
      ],
      {
        cwd: pkg.path,
        stdio: 'pipe',
      }
    )
    console.log(chalk.green(`发布成功：${pkg.name}@${pkg.version}`))
  } catch (e) {
    if (e.stderr.match(/previously published/)) {
      console.log(chalk.red(`跳过已发布的包: ${pkg.name}`))
    } else {
      throw e
    }
  }
}

/**
 * Get the packages that have changed. Based on `lerna changed` but without lerna.
 *
 * @returns {Promise<{ name: string; path: string; pkg: any; version: string }[]>}
 */
async function getChangedPackages() {
  let lastTag

  try {
    const { stdout } = await run('git', ['describe', '--tags', '--abbrev=0'], {
      stdio: 'pipe',
    })
    lastTag = stdout
  } catch (error) {
    // maybe there are no tags
    console.error(`未找到最近的标签，将使用第一个提交作为最近的标签`)
    const { stdout } = await run(
      'git',
      ['rev-list', '--max-parents=0', 'HEAD'],
      { stdio: 'pipe' }
    )
    lastTag = stdout
  }
  const folders = await readdir(join(__dirname, '../packages'))

  const pkgs = await Promise.all(
    folders.map(async folder => {
      folder = join(__dirname, '../packages', folder)
      if (!(await fs.lstat(folder)).isDirectory()) return null

      const pkg = JSON.parse(
        await fs.readFile(join(folder, 'package.json'), 'utf-8')
      )
      if (!pkg.private) {
        const { stdout: hasChanges } = await run(
          'git',
          [
            'diff',
            lastTag,
            '--',
            // apparently {src,package.json} doesn't work
            join(folder, 'src'),
            join(folder, 'package.json'),
          ],
          { stdio: 'pipe' }
        )

        if (hasChanges) {
          return {
            path: folder,
            name: pkg.name,
            version: pkg.version,
            pkg,
          }
        } else {
          return null
        }
      }
    })
  )

  // @ts-ignore
  return pkgs.filter(p => p)
}

main()
