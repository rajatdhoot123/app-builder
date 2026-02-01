import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuildModule } from './build/build.module';

@Module({
  imports: [BuildModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}