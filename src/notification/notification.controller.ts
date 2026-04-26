import { Body, Controller, Post } from '@nestjs/common';
import { SendNotificationDto } from './send-notification.dto';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post('send')
	send(@Body() body: SendNotificationDto) {
		return this.notificationService.send(body);
	}
}
