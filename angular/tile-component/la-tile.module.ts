import {CommonModule} from '@angular/common';
import {NgModule, ModuleWithProviders} from '@angular/core';
import {LaTileComponent} from './la-tile.component';
import {LaImageModule} from '../image/la-image.module';

export {LaTileComponent} from './la-tile.component';

// Export module's public API

@NgModule({
  imports: [
    CommonModule,
    LaImageModule.forRoot()
  ],
  exports: [LaTileComponent],
  declarations: [LaTileComponent]
})
export class LaTileModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: LaTileModule,
      providers: []
    };
  }
}
