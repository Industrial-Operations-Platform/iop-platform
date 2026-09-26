import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('IOP local API host')
    .setDescription('Health plus explicitly activated local analytical POC. Business operations require a configured local demo session, current site permissions and exact configured scope; no shared-user authentication claim.')
    .setVersion('0.0.0')
    .build());
}
