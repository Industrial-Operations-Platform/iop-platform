import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('IOP local API host')
    .setDescription('Process liveness only. No business operations or database readiness.')
    .setVersion('0.0.0')
    .build());
}
