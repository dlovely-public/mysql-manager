import { Table, useServer } from '@dlovely/mysql'

export const mysql = useServer()

export const user_list = new Table('clockin', 'user_list')
