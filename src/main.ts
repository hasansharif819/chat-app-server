// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import * as cookieParser from 'cookie-parser';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
  
//   app.useGlobalPipes(new ValidationPipe());
//   app.use(cookieParser());
//    app.enableCors({
//      origin: 'http://localhost:3000',
//      credentials: true,
//    });

//   // app.enableCors({
//   //   origin: [process.env.FRONTEND_URL, 'http://localhost:3000'],
//   //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   //   allowedHeaders: ['Content-Type', 'Authorization'],
//   //   credentials: true,
//   // });

  

//   await app.listen(8000);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT || 8000);
}
bootstrap();
