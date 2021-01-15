import { Path3D } from "../geometry/Path3D";
import { Camera3D } from "./Camera3D";
import { Object3D } from "./Object3D";

class SVG3D {
  svg: SVGSVGElement;
  elements: { [key: string]: Path3D[] } = {};
  o: { x: number; y: number };
  Viewer: Camera3D;
  constructor(
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    origin = { x: 0.5, y: 0.5 }
  ) {
    this.svg = svg;
    this.o = origin;
    this.Viewer = new Camera3D() 
  }
  insert(...objects: Object3D[]) {
    for (let object of objects)
      this.elements[object.id] = object.unrotated3dPlane;
  }
  remove(...objects: Object3D[]) {
    for (let object of objects) delete this.elements[object.id];
  }
  display() {
    this.svg.innerHTML = "";
    const paths = Object.values(this.elements)
      .flat()
      .sort((p1, p2) => p1.zIndex - p2.zIndex);
    for (let path of paths) {
      var div = document.createElement("div");
      div.insertAdjacentElement("afterbegin", path.display(this.origin));
      this.svg.insertAdjacentHTML("beforeend", div.innerHTML);
    }
    // console.log(this.svg.innerHTML);
  }
  get origin() {
    var rect = this.svg.getBoundingClientRect();
    // console.log(rect, this.o);
    return { x: rect.width * this.o.x, y: rect.height * this.o.y };
  }
  set Perspective(p: number) {
    for (let id in this.elements)
      for (let path of this.elements[id]) path.perspective = p;
  }
  set viewer(viewer: Camera3D) {
    this.Viewer = viewer;
    this.display();
  }
}

export { SVG3D };
