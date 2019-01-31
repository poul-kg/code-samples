import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'la-tile',
  template: `
    <div class="la-tile" [ngClass]="{
    'la-tile--cell': kind === 'cell',
    'la-tile--small': kind === 'small',
    'la-tile--image': kind === 'image'
    }" (click)="clicked.next()">
      <ng-content></ng-content>
    </div>`,
  styleUrls: ['./la-tile.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LaTileComponent {
  @Output() clicked: EventEmitter<any> = new EventEmitter();

  private _kind: string;

  get kind(): string {
    return this._kind;
  }

  @Input()
  set kind(kind: string) {
    this._kind = kind;
  }
}
