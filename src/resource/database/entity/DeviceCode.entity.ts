import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export enum DeviceCodeStatus { Pending = 'Pending', Successed = 'Successed', Expired = 'Expired' }

@Entity()
export class DeviceCode {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }

    
    @Column({ type: 'varchar', length: 256, nullable: false, comment: 'Device code' })
    code: string
    
    @Column({ type: 'bigint', nullable: false, default: 0, comment: 'Code valid time (milliseconds)' })
    valid_time: string
    
    @Column({ type: 'uuid', nullable: true, default: null, comment: 'Parent token UUID' })
    token_id: string & { __brand: 'UUID' } | null
    
    @Column({ type: 'varchar', length: 8, nullable: false, comment: 'User code' })
    user_code: string
    
    @Column({ type: 'uuid', array: true, nullable: false, comment: 'Permissions' })
    permissions: Array<string & { __brand: 'UUID' }>
    
    
    @Column({ type: 'uuid', nullable: false, comment: 'Application UUID' })
    application_id: string
    
    @Column({ type: 'uuid', nullable: true, default: null, comment: 'User UUID' })
    user_id: string & { __brand: 'UUID' } | null
    
    

    @Column({ type: 'enum', enum: DeviceCodeStatus, default: DeviceCodeStatus.Pending, comment: 'Token status' })
    status: DeviceCodeStatus

    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}
