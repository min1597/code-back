import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum UserStatus { Initializing = 'Initializing', Normal = 'Normal', Suspended = 'Suspended' }

@Entity()
export class User {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'uuid', nullable: true, default: null, comment: 'Username ID' })
    username_id: string & { __brand: 'UUID' }

    @Column({ type: 'uuid', nullable: true, default: null, comment: 'Password ID' })
    password_id: string & { __brand: 'UUID' }

    @Column({ type: 'uuid', nullable: true, default: null, comment: 'Profile ID' })
    profile_id: string & { __brand: 'UUID' }

    @Column({ type: 'jsonb', nullable: false, default: new Array(), comment: 'Certification data' })
    certifications: Array<{
        id: string & { __brand: 'UUID' },
        type: 'emailAddress' | 'phoneNumber',
        is_primary: boolean,
        is_active: boolean,
        added_date: Date
    }>

    @Column({ type: 'enum', enum: UserStatus, nullable: false, default: UserStatus.Initializing, comment: 'User status'})
    status: UserStatus


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}