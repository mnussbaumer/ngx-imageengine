import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxImageengineComponent } from './ngx-imageengine.component';
import { Component, ViewChild, ElementRef, Input } from "@angular/core";
import { By } from "@angular/platform-browser";

import { IEDirectives, build_IE_url } from "imageengine-helpers";

class MockElementRef implements ElementRef {
    nativeElement;
    
    constructor(element: any, rect: {width: number, height: number, top: number, bottom: number, left: number, right: number}) {
	this.nativeElement = element;
	this.nativeElement.getBoundingClientRect = () => rect;
    }
};

@Component({
    selector : "test-ngchanges",
    template : `<div><lib-ngx-imageengine [directives]="directives_props" path="testing.jpg" host="https://localhost:8000"></lib-ngx-imageengine></div>`
})
export class TestNgChangesComponent {
    @ViewChild(NgxImageengineComponent) public ie_component?: NgxImageengineComponent;
    @Input() directives_props: IEDirectives = {format: "jpg"};
}

function build_url(component: NgxImageengineComponent, directives: IEDirectives): string {
    return build_IE_url(`${component.host}${component.path}`, directives);
};

describe('NgxImageengineComponent', () => {
    let component: NgxImageengineComponent;
    let fixture: ComponentFixture<NgxImageengineComponent>;
    let element: HTMLElement;
    let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
    
    beforeEach(async () => {

	await TestBed
	    .configureTestingModule({declarations: [NgxImageengineComponent, TestNgChangesComponent]})
	    .compileComponents();
    });

    beforeEach(() => {
	fixture = TestBed.createComponent(NgxImageengineComponent);
	component = fixture.componentInstance;
	component.path = "/test.jpg";
	component.host = "http://localhost";
	element = document.createElement("div");
	fixture.detectChanges();
    });



    it("should create", () => {
	expect(component).toBeDefined();
    });

    it("final src url should reflect both host + path", () => {
	let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
	component.wrapper = new MockElementRef(element, rect);
	component.directives = {fit: "cropbox"};
	component.ngAfterViewInit();
	fixture.detectChanges();

	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(img.getAttribute("src")).toBe(build_url(component, {fit: "cropbox"}));
    });

    it("should derive the width but not height (because it's bigger than height) when derive_size is true and the wrapper has dimensions and no fitting is defined", () => {
	let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
	component.wrapper = new MockElementRef(element, rect);
	component.derive_size = true;
	component.ngAfterViewInit();
	fixture.detectChanges();

	const wrapper = fixture.nativeElement.querySelector(".ngx-ie-image-wrapper");
	expect(wrapper).toBeTruthy();

	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(img.getAttribute("src")).toBe(build_url(component, {width: 300, height: 200}));
	expect(img.getAttribute("width")).toBe("300");
	// we do not set height (or width accordingly) on the image attribute because
	// when using the component without an ImageEngine distribution, we don't want
	// to skew/stretch the image and when using with an IE dist. the image that is
	// served will have the exact dimensions and fit exactly.
	////////////
	// eg:
	// say the crop fit is "box", the default one
	// say the dimensions of the original are w: 500px, h: 200px, and our
	// container is 300px by 200px. We build the directives to be 300x200, so to
	// fit the image on that box with crop fit of `box` IE will scale it down to
	// 300px X 120px - if we set the image element height to 200px the image
	// would be stretched 80px on its Y axis.
	// this way we get the correct sized image, and it fits correctly as well
	expect(img.getAttribute("height")).toBeFalsy();
    });

    it("should not have the img element if it's not visible", () => {
	let rect = {width: 300, height: 200, top: 0, bottom: 0, left: 0, right: 0};
	component.wrapper = new MockElementRef(element, rect);
	component.derive_size = true;
	component.ngAfterViewInit();
	fixture.detectChanges();
	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(img).toBeFalsy()
    });

    it("should derive both width and height when derive_size is true and the wraper ref has dimensions and the directives fit method is letterbox", () => {
	let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
	component.wrapper = new MockElementRef(element, rect);
	component.directives = {fit: "letterbox"};
	component.derive_size = true;
	component.ngAfterViewInit();
	fixture.detectChanges();

	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(img.getAttribute("src")).toBe(build_url(component, {
	    fit: "letterbox", width: 300, height: 200
	}));
	
	expect(img.getAttribute("width")).toBe("300");
	expect(img.getAttribute("height")).toBe("200");
    });

    it("should derive both width and height when derive_size is true and the wraper ref has dimensions and the directives fit method is stretch", () => {
	component.derive_size = true;
	let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
	component.wrapper = new MockElementRef(element, rect);
	component.directives = {fit: "stretch"};
	component.ngAfterViewInit();
	fixture.detectChanges();

	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(img.getAttribute("src")).toBe(build_url(component, {
	    fit: "stretch", width: 300, height: 200
	}));
	
	expect(img.getAttribute("width")).toBe("300");
	expect(img.getAttribute("height")).toBe("200");
    });

    it("img shouldn't have neither width nor height when directive no_optimization is true", () => {
	let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
	component.wrapper = new MockElementRef(element, rect);
	component.directives = {no_optimization: true};
	component.ngAfterViewInit();
	fixture.detectChanges();

	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(img.getAttribute("src")).toBe(build_url(component, {
	    no_optimization: true
	}));
	
	expect(img.getAttribute("width")).toBeFalsy();
	expect(img.getAttribute("height")).toBeFalsy();
    });

    it("element should have wrapper classes and image classes", () => {
	let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
	component.wrapper = new MockElementRef(element, rect);
	component.directives = {no_optimization: true};
	component.wrapper_classes = ["testing"];
	component.image_classes = ["image-testing"];
	component.ngAfterViewInit();
	fixture.detectChanges();

	const wrapper = fixture.nativeElement.querySelector(".ngx-ie-image-wrapper");
	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(wrapper.getAttribute("class")).toBe("ngx-ie-image-wrapper testing");
	expect(img.getAttribute("class")).toBe("ngx-ie-image image-testing");
    });

    it("should replace the path with strip_from_src", () => {
	let rect = {width: 300, height: 200, top: 100, bottom: 100, left: 100, right: 100};
	component.wrapper = new MockElementRef(element, rect);
	component.path = "https://some.domain/test.jpg";
	component.strip_from_src = "https://some.domain";
	component.ngAfterViewInit();
	fixture.detectChanges();

	const img = fixture.nativeElement.querySelector(".ngx-ie-image");
	expect(img.getAttribute("src")).toBe(`${component.host}/test.jpg`);
    });
});

