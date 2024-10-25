import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum Algorithm { SHA256 = 'SHA256', SHA512 = 'SHA512' }

@Entity()
export class Password {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'enum', enum: Algorithm, nullable: false, comment: 'Password algorithm' })
    algorithm: Algorithm

    @Column({ type: 'text', nullable: false, comment: 'Hashed data' })
    hash: string
    
    @Column({ type: 'text', nullable: false, comment: 'Salt data' })
    salt: string

    @Column({ type: 'uuid', nullable: false, comment: 'User UUID' })
    user_id: string


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}