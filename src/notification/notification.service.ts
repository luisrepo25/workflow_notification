import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationStatus } from './notification.model';
import { SendNotificationDto } from './send-notification.dto';

@Injectable()
export class NotificationService {
	private readonly messaging = this.createMessagingClient();

	constructor(
		@InjectModel(Notification.name)
		private readonly notificationModel: Model<NotificationDocument>,
	) {}

	async send(body: SendNotificationDto) {
		const titulo = this.pickField(body.titulo, body.Titulo);
		const mensaje = this.pickField(body.mensaje, body.Mensaje);
		const fcmToken = this.pickField(body.fcm_token, body.fcmToken);

		if (!titulo || !mensaje || !fcmToken) {
			throw new BadRequestException('titulo, mensaje y fcm_token son obligatorios');
		}

		const notification = await this.notificationModel.create({
			titulo,
			mensaje,
			fcmToken,
			canal: 'push',
			estado: NotificationStatus.PENDING,
			leida: false,
			intentosReenvio: 1,
		});

		try {
			const messageId = await this.messaging.send({
				token: fcmToken,
				notification: {
					title: titulo,
					body: mensaje,
				},
				data: {
					notificationId: notification._id.toString(),
					titulo,
					mensaje,
				},
			});

			const updatedNotification = await this.notificationModel.findByIdAndUpdate(
				notification._id,
				{
					estado: NotificationStatus.SENT,
					enviadoAt: new Date(),
					firebaseMessageId: messageId,
					pushMeta: {
						messageId,
					},
				},
				{ returnDocument: 'after' },
			);

			return updatedNotification ?? notification;
		} catch (error) {
			const failureMessage = error instanceof Error ? error.message : 'Error desconocido al enviar la notificación';

			await this.notificationModel.findByIdAndUpdate(
				notification._id,
				{
					estado: NotificationStatus.FAILED,
					motivoFalla: failureMessage,
					pushMeta: {
						error: failureMessage,
					},
				},
				{ returnDocument: 'after' },
			);

			throw new InternalServerErrorException('No se pudo enviar la notificación push');
		}
	}

	private pickField(primary?: string, fallback?: string) {
		return primary?.trim() || fallback?.trim() || '';
	}

	private createMessagingClient() {
		if (!getApps().length) {
			const serviceAccountPath = join(process.cwd(), 'firebase-adminsdk.json');
			const rawServiceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as {
				project_id?: string;
				client_email?: string;
				private_key?: string;
			};
			const serviceAccount: ServiceAccount = {
				projectId: rawServiceAccount.project_id,
				clientEmail: rawServiceAccount.client_email,
				privateKey: rawServiceAccount.private_key?.replace(/\\n/g, '\n'),
			};

			initializeApp({
				credential: cert(serviceAccount),
			});
		}

		return getMessaging();
	}
}
