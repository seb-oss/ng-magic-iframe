import {
    AfterViewInit,
    ChangeDetectionStrategy, ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewChild
} from '@angular/core';
import {BehaviorSubject, forkJoin, fromEvent, Observable, ReplaySubject, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, skip, takeUntil, tap} from 'rxjs/operators';
import elementResizeDetectorMaker from 'element-resize-detector';
import {IframeEvent, IframeEventName} from '../interfaces/iframe-event';
import {EventManager} from '@angular/platform-browser';

@Component({
    selector: 'seb-ng-magic-iframe',
    template: `
        <ng-container *ngIf="source">
            <div class="seb-iframe-loading" *ngIf="$loading | push">
                <ng-content></ng-content>
            </div>
            <iframe #iframe [src]="source | safe" frameborder="0" class="seb-iframe" [ngStyle]="$styling | push" scrolling="no"></iframe>
        </ng-container>
    `,
    styles: [`
        /*:host {
            position: relative;
            display: block;
            overflow-y: hidden;
        }*/
        .seb-iframe {
            overflow: hidden;
            width: 100%;
        }
        .seb-iframe-loading {
            height: 100%;
            width: 100%;
            position: absolute;
            z-index: 1;
        }
        .seb-iframe-loading::after {
            background: #fff;
            content: '';
            display: block;
            height: 100%;
            position: absolute;
            top: 0;
            width: 100%;
            z-index: -1;
            left: 0;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgMagicIframeComponent implements OnInit, OnDestroy {
    get minWidth(): string {
        return this._minWidth;
    }

    @Input() set minWidth(value: string) {
        this._minWidth = value;
    }

    get height(): string {
        return this._height;
    }

    @Input() set height(value: string) {
        this._height = value;
    }

    get resizeContent(): boolean {
        return this._resizeContent;
    }

    @Input() set resizeContent(value: boolean) {
        this._resizeContent = value;
        if (this.resizeContent) {
            if (!this._resizeListener) {
            this._resizeListener = this.eventManager.addGlobalEventListener('window', 'resize',
            event => this.zoom(event));
            }
        } else if (this._resizeListener)  {
            this._resizeListener();
            this._resizeListener = null;
            this._previousZoom = this._zoom;
            this._zoom = 1;
        }
    }
    get matchContentWidth(): boolean | 'auto' {
        return this._matchContentWidth;
    }

    @Input() set matchContentWidth(value: boolean | 'auto') {
        this._matchContentWidth = value;
    }
    get debug(): boolean {
        return this._debug;
    }

    @Input() set debug(value: boolean) {
        this._debug = value;
    }
    get resizeDebounceMillis(): number {
        return this._resizeDebounceMillis;
    }

    @Input() set resizeDebounceMillis(value: number) {
        if (this._resizeDebounceMillis !== value) {
            this.updateStyles();
        }
        this._resizeDebounceMillis = value;

    }
    get autoResize(): boolean {
        return this._autoResize;
    }

    @Input() set autoResize(value: boolean) {
        this._autoResize = value;
    }
    get styleUrls(): Array<string> {
        return this._styleUrls;
    }

    @Input() set styleUrls(value: Array<string>) {
        this._styleUrls = value;
    }
    get styles(): string {
        return this._styles;
    }

    @Input() set styles(value: string) {
        this._styles = value;
    }
    get source(): string {
        return this._source;
    }

    @Input() set source(value: string) {
        this._source = value;
        this.activeSource.next(this.source);
        this.cdr.detectChanges();
    }
    constructor(private renderer: Renderer2, private eventManager: EventManager, private cdr: ChangeDetectorRef) {}

    @Output() iframeEvent: EventEmitter<IframeEvent> = new EventEmitter();

    $iframeClick: ReplaySubject<MouseEvent> = new ReplaySubject<MouseEvent>(1);
    $iframeKeyUp: ReplaySubject<KeyboardEvent> = new ReplaySubject<KeyboardEvent>(1);
    $iframeUnload: ReplaySubject<BeforeUnloadEvent> = new ReplaySubject<BeforeUnloadEvent>(1);
    $loading: BehaviorSubject<boolean> = new BehaviorSubject(true);
    $styling: Observable<any>;
    iframeDocument: Document;
    iframeBody: HTMLElement;

    activeSource: BehaviorSubject<string> = new BehaviorSubject('');
    elementResizeDetector: elementResizeDetectorMaker.Erd;
    private _debug = false;
    private eventListeners: Array<any> = [];
    private $unsubscribe = new Subject();
    private elementRef: ElementRef;
    @ViewChild('iframe') set content(content: ElementRef) {
        if (content && !this.elementRef) {
            this.elementRef = content;
            this.init();
        }
    }
    private _source: string;
    private _styles: string;
    private $iframeSize: BehaviorSubject<{minWidth?: string, height: string}> =
        new BehaviorSubject<{minWidth?: string, height: string}>(null);
    private _styleUrls: Array<string>;
    private _autoResize = true;
    private _resizeDebounceMillis = 50;
    private _matchContentWidth: boolean | 'auto' = false;
    private _hasBodyWidthRule = false;
    private _styleElement: HTMLElement;
    private _zoom = 1;
    private _previousZoom: number;
    private _resizeContent = false;
    private _resizeListener: Function;
    private _minWidth: string;
    private _height: string;

    private static filterCssRuleBodyWidth(cssRule: CSSRule) {
        return (cssRule && cssRule.type === 1 // filter style rules of type 1 i.e. CSSStyleRule
            && cssRule['selectorText'] === 'body') // filter rules that apply to body
            && (cssRule['style'].width || cssRule['style'].minWidth); // that contains width or minWidth
    }

    private zoom(event?: Event) {
        const zoom = this._previousZoom && this._hasBodyWidthRule ?
            this._previousZoom : (this.elementRef.nativeElement.clientWidth / this.iframeBody.offsetWidth);
        this._previousZoom = null;
        this._zoom = zoom > 1 ? 1 : zoom;
        this.iframeBody.style.zoom = this._zoom.toString();
        this.updateSize();

        // emit content resized event
        this.emitEvent('iframe-content-resized');
    }

    private updateStyles() {
        this.$styling = this.$iframeSize.pipe(
            skip(1),
            distinctUntilChanged(),
            debounceTime(this.resizeDebounceMillis),
            map((iframeSize) => (
                (this.matchContentWidth !== false && this._hasBodyWidthRule && iframeSize.minWidth && !this.resizeContent)
                || this.minWidth ? {
                    'height': this.height || iframeSize.height,
                    'minWidth': this.minWidth || iframeSize.minWidth
                } : {
                    'height': this.height || iframeSize.height
                })
            ),
            tap(() => this.emitEvent('iframe-resized'))
        );
    }

    private addStyleSheets(styleUrls) {
        if (styleUrls.length > 0) {

            // create placeholder for subjects
            const loadSubjects: Array<Subject<string>> = [];

            // loop through all style sheets...
            styleUrls.map((styleUrl: string) => {

                // create link element
                const linkElement: HTMLElement  = this.iframeDocument.createElement('link');
                linkElement['rel'] = 'stylesheet';
                linkElement['type'] = 'text/css';
                linkElement['href'] = styleUrl;

                // create load subject that will emit once the stylesheet has loaded
                const loadSubject: Subject<string> = new Subject<string>();
                loadSubjects.push(loadSubject);

                // listen to load event on link
                const stylesheetLoadListener = this.renderer.listen(linkElement, 'load', () => {
                    this.iframeBody.style.overflow = 'inherit';
                    this.emitEvent('iframe-stylesheet-loaded', styleUrl);
                    loadSubject.next(styleUrl);
                    loadSubject.complete();
                    return true;
                });

                // push listener to array so that we can remove them later
                this.eventListeners.push(stylesheetLoadListener);

                // add link to iframe head
                this.iframeDocument.head.insertBefore(linkElement, this._styleElement);

                // emit load event
                this.emitEvent('iframe-stylesheet-load', styleUrl);
            });

            forkJoin(loadSubjects)
                .pipe(
                    takeUntil(this.$unsubscribe)
                )
                .subscribe(() => {
                    if (styleUrls.length > 1) {
                        this.emitEvent('iframe-all-stylesheets-loaded', styleUrls);
                    }
                    // check if body has width rule defined
                    this.hasBodyWidthRule();
                    this.$loading.next(false);
                });
        }
    }

    private preventOverflow() {
        const styleElement = this.iframeDocument.createElement('style');
        this._styleElement = styleElement;
        styleElement.appendChild(this.iframeDocument.createTextNode('html { overflow: hidden; }'));
        this.iframeDocument.getElementsByTagName('head')[0].appendChild(styleElement);
    }

    private addCss(styles: string) {
        const styleElement = this.iframeDocument.createElement('style');
        styleElement.appendChild(this.iframeDocument.createTextNode(styles));
        this.iframeDocument.getElementsByTagName('head')[0].appendChild(styleElement);
        this.emitEvent('iframe-styles-added');
    }

    updateSize(body?: HTMLElement, style?: any) {
            const computedStyle =  style || this.elementRef.nativeElement.contentWindow.getComputedStyle(this.iframeBody);
            const offsetHeight = this.iframeBody.offsetHeight;
            const marginTop = parseInt(computedStyle.getPropertyValue('margin-top'), 10);
            const marginBottom = parseInt(computedStyle.getPropertyValue('margin-bottom'), 10);
            const height = offsetHeight + marginTop + marginBottom;
            const width = this.iframeBody.offsetWidth;
            const iframeSize = {height: height * this._zoom + 'px', minWidth: width + 'px'};
            this.$iframeSize.next(iframeSize);
    }

    private addElementResizeDetector(body: HTMLElement, style: any) {
        this.elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'});
        this.elementResizeDetector.listenTo(body, () => {
            this.updateSize(body, style);
        });
    }

    private hasBodyWidthRule() {
        if (this.matchContentWidth !== 'auto') {
            this._hasBodyWidthRule = <boolean>this.matchContentWidth;
            return;
        }
        try {
            // return all rules applied to body containing 'width'
            let widthRule = [].slice.call(this.iframeDocument.styleSheets)
                .reduce((prev, styleSheet) => {
                    return styleSheet.cssRules ? [...prev, [].slice.call(styleSheet.cssRules)
                            .map(rule => rule.type === 4 ? ([].slice.call(rule.cssRules)
                                // get last media query rule for selector or return basic css style rule
                                .filter(NgMagicIframeComponent.filterCssRuleBodyWidth).pop()) : rule)
                            .filter(NgMagicIframeComponent.filterCssRuleBodyWidth)
                            .reduce((prevCss, cssRule: CSSRule) => [...prevCss, cssRule['style'].width || cssRule['style'].minWidth], [])]
                        : [...prev];
                }, []);
            widthRule = [].concat.apply([], widthRule);
            this._hasBodyWidthRule = widthRule.length > 0;
        } catch (error) {
            console.log('Can\'t read css rules from stylesheet loaded from external domain.');
            console.warn(error);
        }
    }

    private removeElementResizeDetector() {
        if (this.iframeBody && this.elementResizeDetector) {
            this.elementResizeDetector.uninstall(this.iframeBody);
        }
    }

    private emitEvent(eventName: IframeEventName, resource?: string) {
        const iframeEvent: IframeEvent = { event: eventName, src: this.activeSource.value};
        if (resource) {
            iframeEvent.resource = resource;
        }
        this.iframeEvent.emit(iframeEvent);
        if (this.debug) {
            console.log(iframeEvent);
        }
    }

    reload() {
        if (this.iframeDocument && this.iframeDocument.location) {
            this.iframeDocument.location.reload();
        }
    }

    ngOnInit() {
        // this.activeSource = this.source;
        this.$loading.pipe(
            filter(value => value === false || value === null),
            takeUntil(this.$unsubscribe)
        ).subscribe((res) => {
            this.emitEvent(res === null ? 'iframe-loaded-with-errors' : 'iframe-loaded');

            // zoom content
            if (this.resizeContent) {
                this.zoom();
            }
        });
        this.updateStyles();
    }

    init() {
        const iframe = this.elementRef.nativeElement;
        this.$iframeClick
            .pipe(
                takeUntil(this.$unsubscribe)
            ).subscribe(() => {
            this.emitEvent('iframe-click');
        });
        this.$iframeKeyUp
            .pipe(
                takeUntil(this.$unsubscribe)
            ).subscribe(() => {
            this.emitEvent('iframe-keyup');
        });
        this.$iframeUnload
            .pipe(
                takeUntil(this.$unsubscribe)
            ).subscribe(() => {
            this.$loading.next(true);
            this.emitEvent('iframe-unloaded');
            this.iframeBody.style.overflow = 'hidden';
        });

        fromEvent(iframe, 'load')
            .pipe(
                takeUntil(this.$unsubscribe)
            )
            .subscribe(() => {
                try {
                    this.activeSource.next(iframe.contentWindow.location.href);

                    // declare iframe document and body
                    this.iframeDocument = iframe.contentDocument;
                    this.iframeBody = this.iframeDocument.body;

                    // prevent overflow for iframe body
                    this.preventOverflow();

                    // add inline css
                    if (this.styles) {
                        this.addCss(this.styles);
                    }

                    // add external stylesheets
                    if (this.styleUrls && this.styleUrls.length > 0) {
                        this.addStyleSheets(this.styleUrls);
                    } else {
                        // check if body has width rule defined
                        this.hasBodyWidthRule();
                        this.$loading.next(false);
                    }

                    // add element resize detector
                    if (this.autoResize) {
                        this.addElementResizeDetector(this.iframeBody, iframe.contentWindow.getComputedStyle(this.iframeBody));
                    }

                    // add click listener
                    const clickListener = this.renderer.listen(
                        iframe.contentWindow,
                        'click',
                        ($event: MouseEvent) => this.$iframeClick.next($event)
                    );
                    this.eventListeners.push(clickListener);

                    // add key up listener
                    const keyUpListener = this.renderer.listen(
                        iframe.contentWindow,
                        'keyup',
                        ($event: KeyboardEvent) => this.$iframeKeyUp.next($event)
                    );
                    this.eventListeners.push(keyUpListener);

                    // add unload listener
                    const unloadListener = this.renderer.listen(
                        iframe.contentWindow,
                        'beforeunload',
                        ($event: BeforeUnloadEvent) => this.$iframeUnload.next($event)
                    );
                    this.eventListeners.push(unloadListener);
                } catch (error) {
                    console.log('Event listeners and/or styles and resize listener could not be added due to a cross-origin frame error.');
                    console.warn(error);
                    this.$loading.next(null);
                }
            });
    }

    ngOnDestroy(): void {
        this.$unsubscribe.next();
        this.$unsubscribe.complete();

        // detach event listeners
        this.eventListeners.map((listener) => listener());

        // if auto resize...
        if (this.autoResize) {
            // ...try and remove element resize detector
            this.removeElementResizeDetector();
        }
    }

}
