import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from './notification/notification.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri = normalizeMongoUri(
          configService.get<string>('MONGODB_URI_DIRECT') ??
            configService.get<string>('MONGODB_URI') ??
            configService.get<string>('MONGO_URI'),
        );

        return {
          uri: mongoUri,
        };
      },
    }),
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

function normalizeMongoUri(uri?: string) {
  const value = uri?.trim();

  if (!value) {
    throw new Error(
      'Set MONGODB_URI_DIRECT, MONGODB_URI or MONGO_URI before starting the app.',
    );
  }

  return value.replace(/^['"]|['"]$/g, '');
}
