var pi = Math.PI,
  cos = Math.cos,
  sin = Math.sin,
  asin = Math.asin,
  round = (number) => {
    return Math.round(number * 1e9) * 1e-9;
  };
var pd2 = pi / 2,
  pm2 = pi * 2,
  pm4 = pi * 4;

class Point {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.i = Symbol();
  }
  rotate(rx = 0, ry = 0, rz = 0, origin = { x: 0, y: 0, z: 0 }) {
    var x = this.x - origin.x,
      y = this.y - origin.y,
      z = this.z - origin.z;
    // Rotation x:
    var r = Math.hypot(y, z);
    if (r != 0) {
      var angle = pd2 - (y < 0 ? -1 : 1) * (pd2 - asin(z / r)) + rx;
      y = cos(angle) * r;
      z = sin(angle) * r;
    }
    // Rotation y:
    var r = Math.hypot(x, z);
    if (r != 0) {
      var angle = pd2 - (x < 0 ? -1 : 1) * (pd2 - asin(z / r)) + ry;
      x = cos(angle) * r;
      z = sin(angle) * r;
    }
    // Rotation z:
    var r = Math.hypot(x, y);
    if (r != 0) {
      var angle = pd2 - (x < 0 ? -1 : 1) * (pd2 - asin(y / r)) + rz;
      x = cos(angle) * r;
      y = sin(angle) * r;
    }
    return new Point(
      round(x + origin.x),
      round(y + origin.y),
      round(z + origin.z)
    );
  }
  affineFunction(point2) {
    a = (point2.x - this.x) / (this.y - point2.y);
    b = point2.y - a * point2.x;
    return { CM: a, oo: b };
  }
}

class Path3D {
  constructor(...points) {
    this.unrotated3dPlane = this.start = points;
    this.path2D = document.createElement("path");
  }
  get rotated3dPlane() {
    var result = [];
    for (point of this.unrotated3dPlane)
      result.push(
        point.rotate(this.rotateX, this.rotateY, this.rotateZ, this.origin)
      );
    return result;
  }
  rotate(rx = 0, ry = 0, rz = 0, origin = { x: 0, y: 0, z: 0 }) {
    var result = [];
    for (point of this.unrotated3dPlane)
      result.push(point.rotate(rx, ry, rz, origin));
    this.unrotated3dPlane = result;
    return this;
  }
  async display(origin = { x: 0, y: 0 }) {
    console.log(origin, this.unrotated3dPlane);
    var str = "";
    for await (point of this.unrotated3dPlane) {
      console.log(
        (this.unrotated3dPlane.indexOf(point) === 0 ? "M " : " L ") +
          (origin.x + point.x) +
          "," +
          (origin.y - point.y),
        point
      );
      str +=
        (this.unrotated3dPlane.indexOf(point) === 0 ? "M " : " L ") +
        (origin.x + point.x) +
        "," +
        (origin.y - point.y);
    }
    this.path2D.setAttribute("d", str + " z");
    return this.path2D;
  }
  intersects(path2) {
    for (p of this.unrotated3dPlane) {
      var aff = p.affineFunction(
        this.unrotated3dPlane[
          (this.unrotated3dPlane.indexOf(p) + 1) % this.unrotated3dPlane
        ]
      );
      for (p2 of path2.unrotated3dPlane) {
        var aff2 = p2.affineFunction(
          path2.unrotated3dPlane[
            (path2.unrotated3dPlane.indexOf(p2) + 1) % path2.unrotated3dPlane
          ]
        );
        var x = (aff.oo - aff2.oo) / (aff2.CM - aff.CM);
        var y = aff.CM * x + aff.oo;
      }
    }
  }
  set rotation(r) {
    this.unrotated3dPlane = this.start;
    this.rotate((r.x, r.y, r.z));
  }
  set fill(f) {
    this.path2D.style.fill = f;
  }
  set stroke(s) {
    this.path2D.style.stroke = s;
  }
  set strokeWidth(w) {
    this.path2D.style.strokeWidth = w;
  }
}

class Object3D {
  constructor(...paths) {
    this.unrotated3dPlane = paths;
    this.id = new ID().value;
  }
  get rotated3dPlane() {
    var result = [];
    for (let path of this.unrotated3dPlane)
      result.push(
        path.rotate(this.rotateX, this.rotateY, this.rotateZ, this.origin)
      );
    return result;
  }
  rotate(rx = 0, ry = 0, rz = 0, origin = { x: 0, y: 0, z: 0 }) {
    var result = [];
    for (let path of this.unrotated3dPlane) {
      console.log(path, this.unrotated3dPlane);
      result.push(path.rotate(rx, ry, rz, origin));
    }
    console.log(result);
    this.unrotated3dPlane = result;
  }
  set rotation(r) {
    for (let path of this.unrotated3dPlane) path.rotation = r;
  }
}

class SVG3D {
  constructor(
    svg = document.createElement("svg"),
    origin = { x: 0.5, y: 0.5 }
  ) {
    this.svg = svg;
    this.elements = {};
    this.o = origin;
  }
  insert(...objects) {
    for (let object of objects)
      this.elements[object.id] = object.unrotated3dPlane;
  }
  remove(...objects) {
    for (let object of objects) this.elements[object.id] = undefined;
  }
  async display() {
    this.svg.innerHTML = "";
    for (let id in this.elements)
      for await (let path of this.elements[id]) {
        var div = document.createElement("div");
        div.insertAdjacentElement(
          "afterbegin",
          await path.display(this.origin)
        );
        this.svg.insertAdjacentHTML("beforeend", div.innerHTML);
      }
    console.log(this.svg.innerHTML);
  }
  get origin() {
    var rect = this.svg.getBoundingClientRect();
    console.log(rect, this.o);
    return { x: rect.width * this.o.x, y: rect.height * this.o.y };
  }
}

class ID {
  static i = ID.ids();
  constructor() {
    this.value = ID.i.next().value;
  }
  static *ids() {
    var id = 0;
    while (true) yield (id++).toString(36);
  }
}