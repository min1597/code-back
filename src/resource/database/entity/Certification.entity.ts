import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export enum CertificationType { PHONE_NUMBER = 'PHONE_NUMBER', EMAIL_ADDRESS = 'EMAIL_ADDRESS', KRID = 'KRID' }
export enum CertificationStatus { Pending = 'Pending', Successed = 'Successed', Registered = 'Registered', Failure = 'Failure', Used = 'Used' }

@Entity()
export class Certification {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }

        
    @Column({ type: 'enum', enum: CertificationType, nullable: false, comment: 'Certification type' })
    type: CertificationType

    @Column({ type: 'text', nullable: false, comment: 'Certification data (e.g. Phone number, Email address)' })
    data: string

    @Column({ type: 'text', nullable: false, comment: 'Verification code (HASH / SHA256)' })
    verification_code: string

    @Column({ type: 'int', nullable: false, default: 0, comment: 'Certification valid time (milliseconds)' })
    valid_time: number


    @Column({ type: 'enum', enum: CertificationStatus, default: CertificationStatus.Pending, comment: 'Certification state' })
    status: CertificationStatus


    @Column({ type: 'uuid', nullable: true, default: null, comment: 'User UUID' })
    user_id: string & { __brand: 'UUID' } | null

    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: false, comment: 'Expires date' })
    expires_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}