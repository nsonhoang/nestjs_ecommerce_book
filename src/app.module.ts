import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { FeatureModulesModule } from './modules/feature-modules.module';

@Module({
  imports: [CoreModule, FeatureModulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
