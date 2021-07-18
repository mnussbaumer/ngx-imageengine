import {
    
    Component,
    OnInit,
    Input,
    ViewChild,
    AfterViewInit,
    ElementRef,
    ChangeDetectorRef,
    OnChanges,
    SimpleChanges,
    HostListener
    
} from "@angular/core";

import { IEDirectives, build_IE_url } from "imageengine-helpers";

export function check_if_in_viewport(
    rect: {
	bottom: number,
	right: number,
	left: number,
	top: number
    },
    viewport: {
	width: number,
	height: number
    }
) {
    return ((rect.top > 0 || rect.bottom > 0) && rect.top < viewport.height) &&
	((rect.left > 0 || rect.right > 0) && rect.left < viewport.width)
};





@Component({
  selector: "lib-ngx-imageengine",
  templateUrl: "./ngx-imageengine.component.html",
    styles: [
	".ngx-ie-image-wrapper { display: flex; flex-flow: column nowrap; justify-content: center; align-items: center; overflow: hidden; }"
    ]
})

export class NgxImageengineComponent implements OnInit, AfterViewInit, OnChanges {
    @Input() directives: IEDirectives = {};
    
    @Input() path: string | null = null;
    @Input() host: string | null = "";
    
    @Input() alt: string | null = "";
    @Input() wrapper_classes: string[] | Set<string> | { [klass: string]: any } = {};
    @Input() wrapper_styles: { [klass: string]: any } | null = null;
    @Input() image_classes: string[] | Set<string> | { [klass: string]: any }  = {};
    @Input() image_styles: { [klass: string]: any } | null = null;

    @Input() responsive: boolean = false;
    @Input() derive_size: boolean = false;
    @Input() lazy: boolean = true;

    @Input() strip_from_src: string = "";

    @Input() debug: boolean = false;

    @ViewChild("wrapper") wrapper!: ElementRef;


    final_host: string = "";
    final_src: string | null = null;
    
    image_width: number | undefined = undefined;
    directive_width: number | undefined = undefined;
    image_height: number | undefined = undefined;
    directive_height: number | undefined = undefined;
    

    viewport: {width: number, height: number} = {width: 0, height: 0};

    is_in_viewport: boolean = false;
    ready: boolean = false;

    resize_timer: number | null = null;
    scroll_timer: number | null = null;

    @HostListener("window:resize", ["$event"]) onResize($event: Event): void {
	if (this.responsive) {
	    
	    if (this.resize_timer) { window.clearTimeout(this.resize_timer); }
	    this.resize_timer = window.setTimeout(() => this.maybe_resize(), 250);
	}
    }

    @HostListener("window:scroll", ["$event"]) onScroll($event: Event): void {
	if (this.lazy) {
	    
	    if (this.scroll_timer) { window.clearTimeout(this.scroll_timer); }
	    this.scroll_timer = window.setTimeout(() => this.maybe_scrolled(), 100);
	}
    }
    
    constructor(private change_detector: ChangeDetectorRef) { }

    ngOnInit(): void {
	
	if (typeof this.path !== "string") {
	    throw new Error("Valid path attribute is required");
	}

	if (this.debug && (typeof this.host !== "string" || this.host.trim() === "")) {
	    console.warn("ImageEngine host wasn't set");
	}

	this.set_final_host();
    }

    ngAfterViewInit(): void {
	this.set_viewport();
	this.set_sizes();
	this.maybe_is_in_viewport();
	this.build_source();
	this.maybe_ready();
    }

    ngOnChanges(changes: SimpleChanges): void {

	let is_changes =
	    changes.directives ||
	    changes.path ||
	    changes.host ||
	    changes.wrapper_classes ||
	    changes.wrapper_styles ||
	    changes.image_classes ||
	    changes.image_styles ||
	    changes.derive_size;

	if (is_changes && !is_changes.firstChange) {
	    this.set_sizes()
	    this.maybe_is_in_viewport();
	    this.build_source();
	    this.maybe_ready();
	}
    }

    set_final_host(): void {
	this.final_host = typeof this.host === "string" ? this.host : "";
    }

    set_viewport(): void {
	this.viewport.width = window.innerWidth || document.documentElement.clientWidth;
	this.viewport.height = window.innerHeight || document.documentElement.clientHeight;
    }
    
    maybe_resize(): void {
	this.set_sizes();
	this.set_viewport();
	this.maybe_is_in_viewport();
	this.maybe_ready();
    }

    maybe_scrolled(): void {
	this.maybe_is_in_viewport();
	this.maybe_ready();
    }

    maybe_is_in_viewport(): void {
	this.is_in_viewport = check_if_in_viewport(this.wrapper.nativeElement.getBoundingClientRect(), this.viewport);
    }

    maybe_ready(): void {
	if (!this.ready && (!this.lazy || this.is_in_viewport)) {
	    this.ready = true;
	    this.change_detector.detectChanges();
	    
	    // this is needed because it might not display the image even though it
	    // changed and loaded
	    this.wrapper.nativeElement.style.backgroundSize = "100%";
	}
    }

    set_sizes(): void {
	if (this.derive_size) {
	    let rect = this.wrapper.nativeElement.getBoundingClientRect();
	    
	    if (this.debug) {
		console.log("derive_size is true: the wrapper element BoundingClientRect is: ", rect);
	    }
	    
	    this.set_sizes_by_fit(rect.width, rect.height);

	} else {
	    if (this.directives.no_optimization) {
		this.directive_width = undefined;
		this.directive_height = undefined;
		this.image_width = undefined;
		this.image_height = undefined;
		
	    } else {
		this.set_sizes_by_fit(this.directives.width, this.directives.height);
	    }
	}
    }

    set_sizes_by_fit(width: number | undefined, height: number | undefined): void {
	width = width ? Math.round(width) : width;
	height = height ? Math.round(height) : height;
	this.directive_width = width;
	this.directive_height = height;
	
	switch(this.directives.fit) {
	    case "cropbox":
		if ((width && width > (this.image_width || 0)) || (height && (height > (this.image_height || 0)))) {
		    if (width && height && width >= (height || 0)) {
			this.image_height = height;
			this.image_width = undefined;
		    } else if (width) {
			this.image_width = width;
			this.image_height = undefined;
		    }
		}
		break;
	    case "letterbox":
	    case "stretch":
		
		if ((width && width > (this.image_width || 0)) || (height && (height > (this.image_height || 0)))) {
		    this.image_width = width;
		    this.image_height = height;
		    
		}
		break;
	    default:
		if (width && width >= (height || 0)) {
		    this.image_width = width;
		    this.image_height = undefined;
		} else if (height) {
		    this.image_height = height;
		    this.image_width = undefined;
		}
		break;
	}
    }

    build_source(): void {
	let final_directives = {...this.directives};
	let final_path = this.path ? this.path.replace(this.strip_from_src, "") : "";
	
	if (this.derive_size) {
	    if (this.debug) {
		console.log("derive_size enabled, overriding directives width and height");
	    }
	    final_directives.width = this.image_width || this.directive_width;
	    final_directives.height = this.image_height || this.directive_height;
	}

	if (this.debug) {
	    console.log(`final_directives object: ${JSON.stringify(final_directives)}`);
	}
	this.final_src = build_IE_url(`${this.final_host}${final_path}`, final_directives, this.debug);
    }

};
