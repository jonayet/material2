/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusableOption, FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  Inject,
} from '@angular/core';
import {
  CanDisable,
  CanDisableRipple,
  mixinDisabled,
  mixinDisableRipple
} from '@angular/material/core';
import {Subject} from 'rxjs';
import {DOCUMENT} from '@angular/common';

// Boilerplate for applying mixins to MatMenuItem.
/** @docs-private */
export class MatMenuItemBase {}
export const _MatMenuItemMixinBase = mixinDisableRipple(mixinDisabled(MatMenuItemBase));

/**
 * This directive is intended to be used inside an mat-menu tag.
 * It exists mostly to set the role attribute.
 */
@Component({
  moduleId: module.id,
  selector: '[mat-menu-item]',
  exportAs: 'matMenuItem',
  inputs: ['disabled', 'disableRipple'],
  host: {
    'role': 'menuitem',
    'class': 'mat-menu-item',
    '[class.mat-menu-item-highlighted]': '_highlighted',
    '[class.mat-menu-item-submenu-trigger]': '_triggersSubmenu',
    '[attr.tabindex]': '_getTabIndex()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.disabled]': 'disabled || null',
    '(click)': '_checkDisabled($event)',
    '(mouseenter)': '_emitHoverEvent()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'menu-item.html',
})
export class MatMenuItem extends _MatMenuItemMixinBase
    implements FocusableOption, CanDisable, CanDisableRipple, OnDestroy {

  private _document: Document;

  /** Stream that emits when the menu item is hovered. */
  readonly _hovered: Subject<MatMenuItem> = new Subject<MatMenuItem>();

  /** Whether the menu item is highlighted. */
  _highlighted: boolean = false;

  /** Whether the menu item acts as a trigger for a sub-menu. */
  _triggersSubmenu: boolean = false;

  constructor(
    private _elementRef: ElementRef,
    @Inject(DOCUMENT) document?: any,
    private _focusMonitor?: FocusMonitor) {

    // @deletion-target 6.0.0 make `_focusMonitor` and `document` required params.
    super();

    if (_focusMonitor) {
      // Start monitoring the element so it gets the appropriate focused classes. We want
      // to show the focus style for menu items only when the focus was not caused by a
      // mouse or touch interaction.
      _focusMonitor.monitor(this._getHostElement(), false);
    }

    this._document = document;
  }

  /** Focuses the menu item. */
  focus(origin: FocusOrigin = 'program'): void {
    if (this._focusMonitor) {
      this._focusMonitor.focusVia(this._getHostElement(), origin);
    } else {
      this._getHostElement().focus();
    }
  }

  ngOnDestroy() {
    if (this._focusMonitor) {
      this._focusMonitor.stopMonitoring(this._getHostElement());
    }

    this._hovered.complete();
  }

  /** Used to set the `tabindex`. */
  _getTabIndex(): string {
    return this.disabled ? '-1' : '0';
  }

  /** Returns the host DOM element. */
  _getHostElement(): HTMLElement {
    return this._elementRef.nativeElement;
  }

  /** Prevents the default element actions if it is disabled. */
  _checkDisabled(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /** Emits to the hover stream. */
  _emitHoverEvent() {
    if (!this.disabled) {
      this._hovered.next(this);
    }
  }

  /** Gets the label to be used when determining whether the option should be focused. */
  getLabel(): string {
    const element: HTMLElement = this._elementRef.nativeElement;
    const textNodeType = this._document ? this._document.TEXT_NODE : 3;
    let output = '';

    if (element.childNodes) {
      const length = element.childNodes.length;

      // Go through all the top-level text nodes and extract their text.
      // We skip anything that's not a text node to prevent the text from
      // being thrown off by something like an icon.
      for (let i = 0; i < length; i++) {
        if (element.childNodes[i].nodeType === textNodeType) {
          output += element.childNodes[i].textContent;
        }
      }
    }

    return output.trim();
  }

}

