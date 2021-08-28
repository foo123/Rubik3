/**
*   Rubik3
*   An intuitive rubik cube class based on Three.js
*
*   https://github.com/foo123/Rubik3
**/
(function(window, undef){

// utils
var
    hasKey = Object.prototype.hasOwnProperty,

    Merge = function(o1, o2) {
        o1 = o1 || {};
        for (var p in o2) if (hasKey.call(o2, p))  o1[p] = o2[p];
        return o1;
    },

    Extends = function(Parent, ChildProto) {
        var F = function(){};
        var C = ChildProto.constructor;
        F.prototype = Parent.prototype;
        C.prototype = new F();
        C.prototype.constructor = C;
        C.prototype = Merge(C.prototype, ChildProto);
        C.prototype.__super__ = Parent.prototype;
        return C;
    },

    Round = Math.round, Abs = Math.abs, rnd = Math.random,

    eq = function(a ,b) {
        var delta = 1e-10;
        //var aa = new THREE.Vector3(Round(a.x), Round(a.y), Round(a.z));
        //var bb = new THREE.Vector3(Round(b.x), Round(b.y), Round(b.z));

        if (Abs(a.x-b.x) <= delta && Abs(a.y-b.y) <= delta && Abs(a.z-b.z) <= delta)
            return(true);
        return(false);
    },

    intRandRange = function(a, b) {
        return Round(rnd() * (b - a) + a);
    },

    toHex = function(col) {
        var hx, prefix = '', i, hl;

        if (col.substr) hx = col;
        else hx = col.toString(16);

        hl = hx.length;
        for (i=0; i<6-hl; i++) prefix += '0';

        return '#' + prefix + hx;
    },

    makecolorsquare = function(col, w, h, y, x)  {
        return ("<div style='position:absolute;background-color:" + toHex(col) + ";width:" + (w) + "px;height:" + (h) + "px;top:" + (y) + "px;left:" + (x) + "px;'></div>");
    }
;

// Rubik Class
// Rubik is subclass of THREE.Object3D
var Rubik = Extends(THREE.Object3D, {

    constructor: function(Np, sidep, dspp, colorsp) {
        var self = this;
        THREE.Object3D.call(self);

        // public properties
        self.rubik = null;
        self.rotation_in_progress = false;
        self.RA = Math.PI * 0.5;
        self.undolist = [];
        self.undo_in_action = false;
        self.undolist_length = 200;
        self.onChange = null;

        self.sides = {
            bottom: 3,
            top: 2,
            right: 0,
            left: 1,
            front: 4,
            back: 5
        };

        var side = 200, N = 3, dsp = 0.3,
            // mutually complementary colors
            colors = {
                inside: 0x2c2c2c,
                top: 0xFF00FF,
                bottom: 0x00FF00,
                left: 0xFFFF00,
                right: 0x0000FF,
                front: 0xFF0000,
                back: 0x00FFFF
            }
        ;

        if (null !== sidep && sidep > 0) side = sidep;
        if (null !==Np && Np > 0) N = parseInt(Np);
        if (null !== dspp && dspp > 0) dsp = dspp;
        if (colorsp) colors = colorsp;

        var cubelets = [],
            xx, yy, zz,
            Nz = N, Nx = N, Ny = N,
            sidex = side, sidey = side, sidez = side,
            sidex2 = sidex / 2, sidey2 = sidey / 2, sidez2 = sidez / 2,
            cubletsidex = sidex / (Nx + (Nx-1) * dsp),
            cubletsidey = sidey / (Ny + (Ny-1) * dsp),
            cubletsidez = sidez / (Nz + (Nz-1) * dsp),
            cubletsidex2 = cubletsidex / 2,
            cubletsidey2 = cubletsidey / 2,
            cubletsidez2 = cubletsidez / 2,
            materials, mii, mat, cubelet
        ;

        // build cubelets
        for (zz=0; zz<Nz; zz++)
        {
            for (xx=0; xx<Nx; xx++)
            {
                for (yy=0; yy<Ny; yy++)
                {
                    materials = [];
                    for (mii=0; mii<6; mii++)
                    {
                        mat = new THREE.MeshBasicMaterial({color: colors.inside});
                        mat.name = 'inside';
                        materials.push(mat);
                    }

                    // color external faces
                    if (0 === yy)
                    {
                        materials[self.sides['bottom']].color.setHex(colors.bottom);
                        materials[self.sides['bottom']].name = 'bottom';
                    }
                    else if (Ny-1 === yy)
                    {
                        materials[self.sides['top']].color.setHex(colors.top);
                        materials[self.sides['top']].name = 'top';
                    }

                    if (Nx-1 === xx)
                    {
                        materials[self.sides['right']].color.setHex(colors.right);
                        materials[self.sides['right']].name = 'right';
                    }
                    else if (0 === xx)
                    {
                        materials[self.sides['left']].color.setHex(colors.left);
                        materials[self.sides['left']].name = 'left';
                    }

                    if (Nz-1 === zz)
                    {
                        materials[self.sides['front']].color.setHex(colors.front);
                        materials[self.sides['front']].name = 'front';
                    }
                    else if (0 === zz)
                    {
                        materials[self.sides['back']].color.setHex(colors.back);
                        materials[self.sides['back']].name = 'back';
                    }

                    // new cubelet
                    cubelet = new THREE.Mesh(
                        new THREE.CubeGeometry(cubletsidex, cubletsidey, cubletsidez, 1, 1, 1, materials),
                        new THREE.MeshFaceMaterial()
                    );

                    // position it centered
                    cubelet.position.x = (cubletsidex + dsp * cubletsidex) * xx - sidex2 + cubletsidex2;
                    cubelet.position.y = (cubletsidey + dsp * cubletsidey) * yy - sidey2 + cubletsidey2;
                    cubelet.position.z = (cubletsidez + dsp * cubletsidez) * zz - sidez2 + cubletsidez2;
                    cubelet.overdraw = true;
                    // add it
                    cubelet.extra_data = {xx: xx, yy: yy, zz: zz};
                    cubelets.push(cubelet);
                    self.add(cubelet);
                }
            }
        }

        self.rubik = {
            N: N,
            colors: {
                front: colors.front,
                back: colors.back,
                top: colors.top,
                bottom: colors.bottom,
                left: colors.left,
                right: colors.right,
                inside: colors.inside
            },
            cubelets: cubelets,
            side: sidex,
            cubeletside: cubletsidex,
            dsp: dsp
        };
    },

    // properties
    rubik : null,
    rotation_in_progress : false,
    RA : 0,
    undolist : null,
    undo_in_action : false,
    undolist_length : 200,
    onChange : null,
    sides : null,

    addHistory: function(actionobj) {
        if (!this.undo_in_action)
        {
            while (this.undolist.length >= this.undolist_length) this.undolist.shift();
            this.undolist.push(actionobj);
        }
        return this;
    },

    undo: function() {
        var undoaction = null;
        if (!this.rotation_in_progress)
        {
            if (this.undolist.length > 0)
            {
                this.undo_in_action = true;
                undoaction = this.undolist.pop();
                if (undoaction.param)
                    undoaction.func.call(this, undoaction.param);
                else
                    undoaction.func.call(this);
                this.undo_in_action = false;
                return undoaction.actiontype;
            }
        }
        return "";
    },

    setRotation: function(params) {
        if (!this.rubik || this.rotation_in_progress) return this;

        var axis = params.axis,
            angle = params.angle,
            row = params.row,
            ind, rangle
        ;

        if (0 == angle) return this;

        ind = this.getCubeletsIndex(axis, row);

        if (null == ind) return this;

        rangle = angle * this.RA;

        axis = axis.charAt(0);
        axis = axis.toLowerCase();

        var m = new THREE.Matrix4();

        switch(axis)
        {
            case "x":
                    m.setRotationX(rangle);
                    break;
            case "y":
                    m.setRotationY(rangle);
                    break;

            case "z":
                    m.setRotationZ(rangle);
                    break;
            default: return; break;
        }

        for (var k=0; k<ind.length; k++)
        {
            var target = this.rubik.cubelets[ind[k]];
            target.matrixAutoUpdate = false;
            target.matrix.multiply(m, target.matrix);
            //target.position = target.matrix.getPosition();
            //target.matrixWorldNeedsUpdate = true;
            //target.updateMatrixWorld(true);
        }
        params.angle = -angle;
        params.duration = 2;

        this.addHistory({func: this.rotate, param: params, actiontype: "setRotation"});

        if (this.onChange) this.onChange.call(this);
        return this;
    },

    scramble: function(nsteps) {
        if (this.rotation_in_progress) return this;

        var axes = ["x", "y", "z"],
            angles = [-2, -1, 1, 2],
            N = this.rubik.N,
            k = 0,
            axis, row, angle
        ;

        if (null == nsteps || nsteps <= 0)
            nsteps = intRandRange(5, 20);

        for (k=0; k<nsteps; k++)
        {
            axis = axes[intRandRange(0, 2)];
            row = intRandRange(0, N-1);
            angle = angles[intRandRange(0, 3)];
            this.setRotation({axis: axis, row: row, angle: angle});
        }
        return this;
    },

    rotate: function(params) {
        if (!this.rubik) return this;
        if (this.rotation_in_progress) return this;

        var duration = 5,
            axis = params.axis,
            row = params.row,
            angle, ind
        ;
        if (null != params.duration) duration = params.duration;
        angle = params.angle;

        if (duration <= 0) return this;
        if (0 == angle) return this;

        ind = this.getCubeletsIndex(axis, row);
        if (null == ind) return this;

        axis = axis.charAt(0);
        axis = axis.toLowerCase();

        var tthis = this,
            obj, tweenDuration, tweenAngle,
            count = this.rubik.N * this.rubik.N,
            onemore = 0
        ;

        var onComplete = function(g) {
            onemore++;
            if (onemore >= count)
            {
                this.thiss.rotation_in_progress = false;
                onemore = 0;

                if (this.params.onComplete) this.params.onComplete.call(this.thiss);
                if (this.thiss.onChange)    this.thiss.onChange.call(this.thiss);
            }
        };

        var onChange = function() {
            var m = new THREE.Matrix4();

            switch (this.axis)
            {
                case "x":
                        m.setRotationX(this.angle-this.prevangle);
                        break;
                case "y":
                        m.setRotationY(this.angle-this.prevangle);
                        break;
                case "z":
                        m.setRotationZ(this.angle-this.prevangle);
                        break;
                default: return; break;
            }
            this.cubelet.matrixAutoUpdate = false;
            this.cubelet.matrix.multiply(m, this.cubelet.matrix);
            this.cubelet.position = this.cubelet.matrix.getPosition();
            this.cubelet.matrixWorldNeedsUpdate = true;
            this.prevangle = this.angle;
        };

        this.rotation_in_progress = true;

        tweenDuration = Math.abs(angle) * duration * 1000;
        tweenAngle = angle * this.RA;

        for (var k=0; k<ind.length; k++)
        {
            obj = {
                cubelet: this.rubik.cubelets[ind[k]],
                axis: axis,
                angle: 0,
                prevangle: 0,
                thiss: this,
                params: params
            };
            new TWEEN.Tween(obj)
                .onUpdate(onChange)
                .onComplete(onComplete)
                .to({angle: tweenAngle}, tweenDuration)
                .easing(TWEEN.Easing.Exponential.EaseInOut)
                .start();
        }
        params.angle = -angle;
        //params.onComplete=null;
        this.addHistory({func: this.rotate, param: params, actiontype: "rotate"});
        return this;
    },

    getCubeletSeenCoords: function(cubelet) {
        if (!this.rubik || this.rotation_in_progress) return null;

        var c;

        if (cubelet instanceof THREE.Mesh) c = cubelet;
        else  c = this.rubik.cubelets[cubelet || 0];

        if (null == c) return null;

        c.matrixAutoUpdate = false;
        c.updateMatrixWorld(true);
        c.position = c.matrix.getPosition();
        return {
            xx: Round((c.position.x + this.rubik.side / 2 - this.rubik.cubeletside / 2) / (this.rubik.cubeletside * (1+this.rubik.dsp))),
            yy: Round((c.position.y + this.rubik.side / 2 - this.rubik.cubeletside / 2) / (this.rubik.cubeletside * (1+this.rubik.dsp))),
            zz: Round((c.position.z + this.rubik.side / 2 - this.rubik.cubeletside / 2) / (this.rubik.cubeletside * (1+this.rubik.dsp)))
        };
    },

    getCubeletsIndex: function(axis, row) {
        if (!this.rubik) return [];
        if (this.rotation_in_progress) return [];

        var a, result, i, l = this.rubik.cubelets.length;

        if (row < 0 || row >= this.rubik.N) return [];

        axis = axis.charAt(0).toLowerCase();

        a = new Array(l); result = new Array(this.rubik.N*this.rubik.N);
        for (i=0; i<l; i++)
        {
            this.rubik.cubelets[i].matrixAutoUpdate = false;
            this.rubik.cubelets[i].updateMatrixWorld(true);
            this.rubik.cubelets[i].position = this.rubik.cubelets[i].matrix.getPosition();

            switch(axis)
            {
                case "y":
                        a[i] = [i, this.rubik.cubelets[i].position.y];
                        break;
                case "x":
                        a[i] = [i, this.rubik.cubelets[i].position.x];
                        break;
                case "z":
                        a[i] = [i,this.rubik.cubelets[i].position.z];
                        break;
                default: return null;
            }
        }

        a.sort(function(a, b){return a[1] - b[1];});
        for (i=0; i<result.length; i++)
            result[i] = a[row * this.rubik.N * this.rubik.N + i][0];

        return result;
    },

    getFacesAsSeen: function(cubelet) {
        if (!this.rubik || this.rotation_in_progress) return null;

        var c, cl, i, n, m;
        if (cubelet instanceof THREE.Mesh) c = cubelet;
        else c = this.rubik.cubelets[cubelet || 0];

        if (null == c) return null;

        n = [];
        c.matrixAutoUpdate = false;
        c.updateMatrixWorld(true);
        c.position = c.matrix.getPosition();
        c.geometry.computeFaceNormals();
        cl = c.geometry.faces.length;

        m = c.matrix.clone();
        m.setPosition(new THREE.Vector3(0,0,0));

        for (i=0; i<cl; i++)
        {
             n.push(m.multiplyVector3(c.geometry.faces[i].normal.clone()).normalize());
        }

        var materials = c.geometry.materials,
            mat = null, matname = "",
            r1 = [], r2 = [], r3 = [], r4 = [],
            topVector = new THREE.Vector3(0,1,0),
            bottomVector = new THREE.Vector3(0,-1,0),
            frontVector = new THREE.Vector3(0,0,1),
            backVector = new THREE.Vector3(0,0,-1),
            leftVector = new THREE.Vector3(-1,0,0),
            rightVector = new THREE.Vector3(1,0,0)
        ;

        for (i=0; i<n.length; i++)
        {
            mat = materials[i];
            matname = mat.name;
            if (matname.toLowerCase() == "inside")
            {
                /*continue*/;
                r1["inside"] = mat.color;
                r2[matname] = "inside";
                r3["inside"] = matname;
                r4["inside"] = mat;
            }
            else
            {
                if (eq(n[i], topVector) ) // face seen as top
                {
                    r1["top"] = mat.color;
                    r2[matname] = "top";
                    r3["top"] = matname;
                    r4["top"] = mat;
                }
                if (eq(n[i], bottomVector)) // face seen as bottom
                {
                    r1["bottom"] = mat.color;
                    r2[matname] = "bottom";
                    r3["bottom"] = matname;
                    r4["bottom"] = mat;
                }
                if (eq(n[i], frontVector)) // face seen as front
                {
                    r1["front"] = mat.color;
                    r2[matname] = "front";
                    r3["front"] = matname;
                    r4["front"] = mat;
                }
                if (eq(n[i], backVector)) // face seen as back
                {
                    r1["back"] = mat.color;
                    r2[matname] = "back";
                    r3["back"] = matname;
                    r4["back"] = mat;
                }
                // take left-right opposite due to papervision 3d left-right definition on cube etc..?? NO NO
                if (eq(n[i], leftVector)) // face seen as left
                {
                    r1["left"] = mat.color;
                    r2[matname] = "left";
                    r3["left"] = matname;
                    r4["left"] = mat;
                }
                if (eq(n[i], rightVector)) // face seen as right
                {
                    r1["right"] = mat.color;
                    r2[matname] = "right";
                    r3["right"] = matname;
                    r4["right"] = mat;
                }
            }
        }
        return {seencolor: r1, faceseenas: r2, invfaceseenas: r3, mat: r4};
    },

    getFacesByName: function(cubelet, f) {
        if (!this.rubik) return [];

        var c;
        if (cubelet instanceof THREE.Mesh) c = cubelet;
        else  c = this.rubik.cubelets[cubelet || 0];

        if (null == c) return [];

        var result = [], faces = c.geometry.materials, mat = null;

        for (var i=0; i<faces.length; i++)
        {
            mat = faces[i];
            if (mat.name == f)
                result.push(mat);
        }
        return result;
    },

    getFacesByColor: function(cubelet, col) {
        if (!this.rubik) return [];

        var c;
        if (cubelet instanceof THREE.Mesh) c = cubelet;
        else c = this.rubik.cubelets[cubelet || 0];

        if (null == c) return [];

        var result = [], materials = c.geometry.materials, mat = null;

        for (var i=0; i<materials.length; i++)
        {
            mat = materials[i];
            if (mat.color.getHex() == col)
                result.push(mat);
        }
        return result;
    },

    setRubikColors: function(params) {
        if (!this.rubik) return;
        if (this.rotation_in_progress) return;

        var colorsobj = params.colors,
            faces = null, i, j,
            cclone = {
                front: this.rubik.colors.front,
                back: this.rubik.colors.back,
                top: this.rubik.colors.top,
                bottom: this.rubik.colors.bottom,
                left: this.rubik.colors.left,
                right: this.rubik.colors.right,
                inside: this.rubik.colors.inside
            },
            cclone2 = {
                front: this.rubik.colors.front,
                back: this.rubik.colors.back,
                top: this.rubik.colors.top,
                bottom: this.rubik.colors.bottom,
                left: this.rubik.colors.left,
                right: this.rubik.colors.right,
                inside: this.rubik.colors.inside
            },
            n, m, allow = true
        ;

        // don't allow 2 identical colors on different faces
        for (n in colorsobj)
            cclone2[n] = colorsobj[n];

        for (n in cclone2)
        {
            for (m in cclone2)
            {
                if (cclone2[n] == cclone2[m] && n != m)
                {
                    allow = false;
                    return false;
                    //break;
                }
            }
        }

        //if ( !allow ) return false;

        if (colorsobj != null)
        {
            for (i=0; i<this.rubik.cubelets.length; i++)
            {
                if (colorsobj.top != null)
                {
                    faces = this.getFacesByColor(this.rubik.cubelets[i], cclone.top);
                    for (j=0; j<faces.length; j++)
                        if (faces[j].name != "inside")
                            faces[j].color.setHex(colorsobj.top);
                    this.rubik.colors.top = colorsobj.top;
                }
                if (colorsobj.bottom != null)
                {
                    faces = this.getFacesByColor(this.rubik.cubelets[i], cclone.bottom);
                    for (j=0; j<faces.length; j++)
                        if (faces[j].name != "inside")
                            faces[j].color.setHex(colorsobj.bottom);
                    this.rubik.colors.bottom = colorsobj.bottom;
                }
                if (colorsobj.left != null)
                {
                    faces = this.getFacesByColor(this.rubik.cubelets[i], cclone.left);
                    for (j=0; j<faces.length; j++)
                        if (faces[j].name != "inside")
                            faces[j].color.setHex(colorsobj.left);
                    this.rubik.colors.left = colorsobj.left;
                }
                if (colorsobj.right != null)
                {
                    faces = this.getFacesByColor(this.rubik.cubelets[i], cclone.right);
                    for (j=0; j<faces.length; j++)
                        if (faces[j].name != "inside")
                            faces[j].color.setHex(colorsobj.right);
                    this.rubik.colors.right = colorsobj.right;
                }
                if (colorsobj.front != null)
                {
                    faces = this.getFacesByColor(this.rubik.cubelets[i], cclone.front);
                    for (j=0; j<faces.length; j++)
                        if (faces[j].name != "inside")
                            faces[j].color.setHex(colorsobj.front);
                    this.rubik.colors.front = colorsobj.front;
                }
                if (colorsobj.back != null)
                {
                    faces = this.getFacesByColor(this.rubik.cubelets[i], cclone.back);
                    for (j=0; j<faces.length; j++)
                        if (faces[j].name != "inside")
                            faces[j].color.setHex(colorsobj.back);
                    this.rubik.colors.back = colorsobj.back;
                }
                if (colorsobj.inside != null)
                {
                    faces = this.getFacesByName(this.rubik.cubelets[i], "inside"); // this take by name so to avoid mixed ups
                    for (j=0; j<faces.length; j++)
                        faces[j].color.setHex(colorsobj.inside);
                    this.rubik.colors.inside = colorsobj.inside;
                }
            }

            params.colors = cclone;
            this.addHistory({func:this.setRubikColors, param:params, actiontype:"setRubikColors"});

            if (this.onChange) this.onChange.call(this);

            return true;
        }
    },

    getFaceColorAndIndex: function(seenface, ii, jj) {
        if (!this.rubik || this.rotation_in_progress) return null;

        var i, res,
            cubes = this.rubik.cubelets,
            obj, cubeletseenas
        ;

        for (i=0; i<cubes.length; i++)
        {
            obj = this.getFacesAsSeen(cubes[i]);
            cubeletseenas = this.getCubeletSeenCoords(cubes[i]);

            if (obj.seencolor[seenface] != null && obj.seencolor[seenface] != null)
            {
                switch (seenface)
                {
                    case "top":
                            if (cubeletseenas.xx == jj && cubeletseenas.zz == ii)
                                return({color:obj.seencolor[seenface]/*,index:this.rubik.faces.indexOf(obj.mat[seenface])*/});
                            break;
                    case "bottom":
                            if (cubeletseenas.xx == jj && cubeletseenas.zz == this.rubik.N-1-ii)
                                return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
                            break;
                    case "left":
                            if (cubeletseenas.yy == this.rubik.N-1-ii && cubeletseenas.zz == this.rubik.N-1-jj)
                                return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
                            break;
                    case "right":
                            if (cubeletseenas.yy == this.rubik.N-1-ii && cubeletseenas.zz == jj)
                                return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
                            break;
                    case "front":
                            if (cubeletseenas.xx == jj && cubeletseenas.yy == this.rubik.N-1-ii)
                                return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
                            break;
                    case "back":
                            if (cubeletseenas.xx == this.rubik.N-1-jj && cubeletseenas.yy == this.rubik.N-1-ii)
                                return({color:obj.seencolor[seenface]/*,index:rubik.faces.indexOf(obj.mat[seenface])*/});
                            break;
                }
            }
        }
        return null;
    },

    getFlatImage: function(el)  {
        if (!this.rubik || this.rotation_in_progress) return;

        var innerHTML = '';
        var N = this.rubik.N;
        /*var w=15;
        var h=15;
        var ds=8;
        var fd=15;
        var fw=N*(w+ds);
        var fh=N*(h+ds);
        var i,j;
        var a,b;
        var obj;*/
        /*if (width>0)
        {
            var dsp:Number=ds/w;
            w=width/(4+4*dsp+N);
            h=w;
            ds=w*dsp;
            fd=w;
            fw=N*(w+ds);
            fh=N*(h+ds);
        }*/
        var i, j,
            w = 5,
            h = 5,
            dd = 3,
            ddd = 5,
            xx, yy
        ;

        //a=fw+fd;
        //b=0;
        var flat = {
            top: [],
            bottom: [],
            front: [],
            back: [],
            left: [],
            right: []
        };

        // top
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                obj = this.getFaceColorAndIndex("top", j, N-1-i);
                flat.top[j+i*N] = obj.color.getHex();
            }
        }
        // top
        xx = N*(w+dd)+ddd;
        yy = 0;
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                innerHTML += makecolorsquare(flat.top[i+(N-1-j)*N], w, h, (yy+i*(h+dd)), (xx+j*(w+dd)));
            }
        }

        //a=0;
        //b=fh+fd;
        // left
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                obj = this.getFaceColorAndIndex("left",j,N-1-i);
                flat.left[j+i*N] = obj.color.getHex();
            }
        }
        // left
        xx = 0;
        yy = N*(h+dd)+ddd;
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                innerHTML += makecolorsquare(flat.left[i+(j)*N], w, h, (yy+i*(h+dd)), (xx+j*(w+dd)));
            }
        }

        //a=fw+fd;
        //b=fh+fd;
        // front
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                obj = this.getFaceColorAndIndex("front",j,N-1-i);
                flat.front[j+i*N] = obj.color.getHex();
            }
        }
        // front
        xx = N*(w+dd)+ddd;
        yy = N*(h+dd)+ddd;
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                innerHTML += makecolorsquare(flat.front[i+(N-1-j)*N], w, h, (yy+i*(h+dd)), (xx+j*(w+dd)));
            }
        }

        //a=2*(fw+fd);
        //b=fh+fd;
        // right
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                obj = this.getFaceColorAndIndex("right",j,N-1-i);
                flat.right[j+i*N] = obj.color.getHex();
            }
        }
        // right
        xx = 2*(N*(w+dd)+ddd);
        yy = N*(h+dd)+ddd;
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                innerHTML += makecolorsquare(flat.right[i+(j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
            }
        }

        //a=3*(fw+fd);
        //b=fh+fd;
        // back
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                obj = this.getFaceColorAndIndex("back",j,N-1-i);
                flat.back[j+i*N] = obj.color.getHex();
            }
        }
        // back
        xx = 3*(N*(w+dd)+ddd);
        yy = N*(h+dd)+ddd;
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                innerHTML += makecolorsquare(flat.back[i+(N-1-j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
            }
        }

        //a=fw+fd;
        //b=2*(fh+fd);
        // bottom
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                obj = this.getFaceColorAndIndex("bottom",j,N-1-i);
                flat.bottom[j+i*N] = obj.color.getHex();
            }
        }
        // bottom
        xx = N*(w+dd)+ddd;
        yy = 2*(N*(h+dd)+ddd);
        for (i=0; i<N; i++)
        {
            for (j=0; j<N; j++)
            {
                innerHTML += makecolorsquare(flat.bottom[i+(N-1-j)*N],w,h,(yy+i*(h+dd)),(xx+j*(w+dd)));
            }
        }
        //callback.call(this,flat);
        el.style.width = String(((w+dd)*N+ddd)*4+10)+'px';
        el.style.height = String(((h+dd)*N+ddd)*3+10)+'px';
        el.innerHTML = innerHTML;
        return flat;
    }
});

// export it
window.Rubik = Rubik;
})(window);