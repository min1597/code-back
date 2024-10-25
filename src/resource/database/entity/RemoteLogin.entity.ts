import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class RemoteLogin {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'char', length: 2, nullable: false, comment: 'Verification code' })
    verification_code: string

    @Column({ type: 'char', length: 2, array: true, nullable: false, comment: 'Dummy verification code' })
    dummy_verification_code: Array<string>

    @Column({ type: 'text', nullable: false, comment: 'Client information' })
    client_info: string

    @Column({ type: 'uuid', nullable: false, comment: 'Token UUID' })
    token_id: string & { __brand: 'UUID' }

    @Column({ type: 'uuid', nullable: false, comment: 'Application UUID' })
    application_id: string & { __brand: 'UUID' }

    @Column({ type: 'text', nullable: true, default: null, comment: 'Remote token' })
    remote_token: string | null



    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, comment: 'Expires date' })
    expires_date: Date | null

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}
