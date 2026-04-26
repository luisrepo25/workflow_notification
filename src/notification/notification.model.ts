import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationStatus {
    PENDING = 'pendiente',
    SENT = 'enviada',
    FAILED = 'fallida',
}

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
    @Prop({ required: true, trim: true, type: String })
    titulo: string;

    @Prop({ required: true, trim: true, type: String })
    mensaje: string;

    @Prop({ required: true, trim: true, type: String })
    fcmToken: string;

    @Prop({ default: 'push', trim: true, type: String })
    canal: string;

    @Prop({ default: NotificationStatus.PENDING, index: true, type: String })
    estado: NotificationStatus;

    @Prop({ default: false, type: Boolean })
    leida: boolean;

    @Prop({ default: 0, type: Number })
    intentosReenvio: number;

    @Prop()
    enviadoAt?: Date;

    @Prop()
    motivoFalla?: string;

    @Prop()
    firebaseMessageId?: string;

    @Prop({ type: Object })
    pushMeta?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);


