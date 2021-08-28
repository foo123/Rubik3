(function(window, undef){
"use strict";

/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
if (!window.requestAnimationFrame)
{
    window.requestAnimationFrame = (function(){
        return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

            window.setTimeout( callback, 1000 / 60 );

        };
    })();
}

var
    container, scramblebt, undobt, newbt,
    flatimage, rubikN, camera, scene, renderer, projector, rubikcube,

    w, h, w2, h2,
    targetRotationY = 0, targetRotationOnMouseDownY = 0, targetRotationX = 0, targetRotationOnMouseDownX = 0,
    rad = 500, mouse = {x:0, y:0}, mouseX = 0, mouseXOnMouseDown = 0, mouseY = 0, mouseYOnMouseDown = 0, mouseX0 = mouseX, mouseY0 = mouseY,

    //cstop, csbottom, csleft, csright, csfront, csback, csinside,
    //cstope, csbottome, cslefte, csrighte, csfronte, csbacke, csinsidee,
    pressed_cub, released_cub, isCubeRotation = false,

    // mutually complementary colors
    colors = {
        inside: 0x2c2c2c,
        top: 0xFF00FF,
        bottom: 0x00FF00,
        left: 0xFFFF00,
        right: 0x0000FF,
        front: 0xFF0000,
        back: 0x00FFFF
    },

    multx = 0.5*Math.PI, multy = -Math.PI
;

function range(what, min, max, closed)
{
    return true===closed ? ((what <= max) && (what >= min)) : ((what < max) && (what > min));
}

/*function max(v)
{
    var xx = Math.abs(v.x), yy = Math.abs(v.y), zz = Math.abs(v.z);
    if (xx >= yy && xx >= zz) return 'x';
    else if (yy >= xx && yy >= zz) return 'y';
    else if (zz >= xx && zz >= yy) return 'z';
    return 'x';
}*/

/*function toHex(col)
{
    var hx, hl, prefix = '', i;

    if ( col.substr ) hx = col;
    else  hx = col.toString(16);

    hl = hx.length;
    for (i=0; i<6-hl; i++) prefix += '0';
    return('#' + prefix + hx);
}*/

function recursive_offset(node)
{
    var x = 0, y = 0, nodeStyle;

    while (node)
    {
        try {
            nodeStyle = window.getComputedStyle(node);
        } catch(e) {
            nodeStyle = null;
        }
        if (node.scrollLeft) x += node.scrollLeft;
        if (node.scrollTop) y += node.scrollTop;
        if (node.offsetLeft) x -= node.offsetLeft;
        if (node.offsetTop) y -= node.offsetTop;
        if (nodeStyle && nodeStyle.marginLeft) x -= parseInt(nodeStyle.marginLeft, 10);
        if (nodeStyle && nodeStyle.marginTop) y -= parseInt(nodeStyle.marginTop, 10);
        node = node.parentNode
    }
    return {x:x, y:y};
}

/*function cstop_change_update(hsb, hex, rgb)
{
    var bb=colors.top;
    colors.top=parseInt(hex,16);
    if (rubikcube.setRubikColors({colors:colors}))
    {
        cstope.style.backgroundColor=toHex(hex);
        updateflatimage();
    }
    else
        colors.top=bb;
    $(cstope).ColorPickerHide();
}

function csbottom_change_update(hsb, hex, rgb)
{
    var bb=colors.bottom;
    colors.bottom=parseInt(hex,16);
    if (rubikcube.setRubikColors({colors:colors}))
    {
        csbottome.style.backgroundColor=toHex(hex);
        updateflatimage();
    }
    else
        colors.bottom=bb;
    $(csbottome).ColorPickerHide();
}

function csleft_change_update(hsb, hex, rgb)
{
    var bb=colors.left;
    colors.left=parseInt(hex,16);
    if (rubikcube.setRubikColors({colors:colors}))
    {
        cslefte.style.backgroundColor=toHex(hex);
        updateflatimage();
    }
    else
        colors.left=bb;
    $(cslefte).ColorPickerHide();
}

function csright_change_update(hsb, hex, rgb)
{
    var bb=colors.right;
    colors.right=parseInt(hex,16);
    if (rubikcube.setRubikColors({colors:colors}))
    {
        csrighte.style.backgroundColor=toHex(hex);
        updateflatimage();
    }
    else
        colors.right=bb;
    $(csrighte).ColorPickerHide();
}

function csfront_change_update(hsb, hex, rgb)
{
    var bb=colors.front;
    colors.front=parseInt(hex,16);
    if (rubikcube.setRubikColors({colors:colors}))
    {
        csfronte.style.backgroundColor=toHex(hex);
        updateflatimage();
    }
    else
        colors.front=bb;
    $(csfronte).ColorPickerHide();
}

function csback_change_update(hsb, hex, rgb)
{
    var bb=colors.back;
    colors.back=parseInt(hex,16);
    if (rubikcube.setRubikColors({colors:colors}))
    {
        csbacke.style.backgroundColor=toHex(hex);
        updateflatimage();
    }
    else
        colors.back=bb;
    $(csbacke).ColorPickerHide();
}

function csinside_change_update(hsb, hex, rgb)
{
    var bb=colors.inside;
    colors.inside=parseInt(hex,16);
    if (rubikcube.setRubikColors({colors:colors}))
    {
        csinsidee.style.backgroundColor=toHex(hex);
        updateflatimage();
    }
    else
        colors.inside=bb;
    $(csinsidee).ColorPickerHide();
}

function updatecolors()
{
    cstope.style.backgroundColor = toHex(colors.top);
    csbottome.style.backgroundColor = toHex(colors.bottom);
    cslefte.style.backgroundColor = toHex(colors.left);
    csrighte.style.backgroundColor = toHex(colors.right);
    csfronte.style.backgroundColor = toHex(colors.front);
    csbacke.style.backgroundColor = toHex(colors.back);
    csinsidee.style.backgroundColor = toHex(colors.inside);
}

function cs_init()
{
    cstope = document.getElementById("cstop1");
    csbottome = document.getElementById("csbottom1");
    cslefte = document.getElementById("csleft1");
    csrighte = document.getElementById("csright1");
    csfronte = document.getElementById("csfront1");
    csbacke = document.getElementById("csback1");
    csinsidee = document.getElementById("csinside1");

    updatecolors();

    $(cstope).ColorPicker({
        onSubmit: cstop_change_update,
        onBeforeShow: function () {
            $(this).ColorPickerSetColor(colors.top.toString(16));
        },
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        }
    });

    $(csbottome).ColorPicker({
        onSubmit: csbottom_change_update,
        onBeforeShow: function () {
            $(this).ColorPickerSetColor(colors.bottom.toString(16));
        },
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        }
    });

    $(cslefte).ColorPicker({
        onSubmit: csleft_change_update,
        onBeforeShow: function () {
            $(this).ColorPickerSetColor(colors.left.toString(16));
        },
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        }
    });

    $(csrighte).ColorPicker({
        onSubmit: csright_change_update,
        onBeforeShow: function () {
            $(this).ColorPickerSetColor(colors.right.toString(16));
        },
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        }
    });

    $(csfronte).ColorPicker({
        onSubmit: csfront_change_update,
        onBeforeShow: function () {
            $(this).ColorPickerSetColor(colors.front.toString(16));
        },
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        }
    });

    $(csbacke).ColorPicker({
        onSubmit: csback_change_update,
        onBeforeShow: function () {
            $(this).ColorPickerSetColor(colors.back.toString(16));
        },
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        }
    });

    $(csinsidee).ColorPicker({
        onSubmit: csinside_change_update,
        onBeforeShow: function () {
            $(this).ColorPickerSetColor(colors.inside.toString(16));
        },
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        }
    });
}*/

function updateflatimage()
{
    /*var flat =*/rubikcube.getFlatImage(flatimage);
}

function getCubelet(clientX, clientY)
{
    mouse.x = (clientX / w) * 2 - 1;
    mouse.y = -(clientY / h) * 2 + 1;
    var vector = new THREE.Vector3(mouse.x, mouse.y, 1), ray, intersects;
    projector.unprojectVector(vector, camera);
    ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
    intersects = ray.intersectObjects(rubikcube.children);
    return 0 < intersects.length ? {cubelet:intersects[0].object, face:intersects[0].face, ray:ray, vector:vector} : null;
}

function onDocumentMouseDown(event)
{
    onDocumentDown(event, false);
}
function onDocumentTouchStart(event)
{
    onDocumentDown(event, true);
}
function onDocumentDown(event, isTouch)
{
    event.preventDefault();

    var clientX = isTouch ? event.changedTouches[0].clientX : event.clientX,
        clientY = isTouch ? event.changedTouches[0].clientY : event.clientY,
        offset, target;

    offset = recursive_offset(event.target);
    clientX += offset.x; clientY += offset.y;
    target = getCubelet(clientX, clientY);

    if (null == target)
    {
        isCubeRotation = true;
        mouseX0 = mouseX = (clientX / w);
        mouseY0 = mouseY = (clientY / h);

        if (isTouch)
        {
            container.addEventListener('touchmove', onDocumentTouchMove, false);
            container.addEventListener('touchend', onDocumentTouchEnd, false);
            container.addEventListener('touchcancel', onDocumentTouchEnd, false);
        }
        else
        {
            container.addEventListener('mousemove', onDocumentMouseMove, false);
            container.addEventListener('mouseup', onDocumentMouseUp, false);
            container.addEventListener('mouseout', onDocumentMouseOut, false);
        }
    }
    else
    {
        isCubeRotation = false;
        var cubeletseenas = rubikcube.getCubeletSeenCoords(target.cubelet),
            f = rubikcube.getFacesAsSeen(target.cubelet), matname;
        if (null == f) return;

        matname = target.cubelet.geometry.materials[target.face.materialIndex].name;
        pressed_cub = {
            cub: target.cubelet,
            seenas: {
                name: f.faceseenas[matname],
                xx: cubeletseenas.xx,
                yy: cubeletseenas.yy,
                zz: cubeletseenas.zz
            }
        };

        if (isTouch)
        {
            //container.addEventListener('touchmove', onDocumentTouchMove, false);
            container.addEventListener('touchend', onDocumentTouchEnd, false);
            container.addEventListener('touchcancel', onDocumentTouchEnd, false);
        }
        else
        {
            //container.addEventListener('mousemove', onDocumentMouseMove, false);
            container.addEventListener('mouseup', onDocumentMouseUp, false);
            container.addEventListener('mouseout', onDocumentMouseOut, false);
        }
    }
}

function onDocumentMouseMove(event)
{
    onDocumentMove(event, false);
}
function onDocumentTouchMove(event)
{
    onDocumentMove(event, true);
}
function onDocumentMove(event, isTouch)
{
    var clientX = isTouch ? event.changedTouches[0].clientX : event.clientX,
        clientY = isTouch ? event.changedTouches[0].clientY : event.clientY,
        offset;

    if (isCubeRotation)
    {
        offset = recursive_offset(event.target);
        clientX += offset.x; clientY += offset.y;

        if (clientX > w || clientX < 0 || clientY > h || clientY < 0) return;
        mouseX = (clientX / w);
        mouseY = (clientY / h);
        targetRotationY += mouseX - mouseX0;
        targetRotationX += mouseY - mouseY0;
        mouseX0 = mouseX;
        mouseY0 = mouseY;
    }
    else
    {
        // do nothing
    }
}

function onDocumentMouseUp(event)
{
    onDocumentUp(event, false);
}
function onDocumentTouchEnd(event)
{
    onDocumentUp(event, true);
}
function onDocumentUp(event, isTouch)
{
    var clientX = isTouch ? event.changedTouches[0].clientX : event.clientX,
        clientY = isTouch ? event.changedTouches[0].clientY : event.clientY,
        offset;

    if (isCubeRotation)
    {
        isCubeRotation = false;
        if (isTouch)
        {
            container.removeEventListener('touchmove', onDocumentTouchMove, false);
            container.removeEventListener('touchend', onDocumentTouchEnd, false);
            container.removeEventListener('touchcancel', onDocumentTouchEnd, false);
        }
        else
        {
            container.removeEventListener( 'mousemove', onDocumentMouseMove, false );
            container.removeEventListener( 'mouseup', onDocumentMouseUp, false );
            container.removeEventListener( 'mouseout', onDocumentMouseOut, false );
        }
    }
    else
    {
        offset = recursive_offset(event.target);
        clientX += offset.x; clientY += offset.y;

        var target = getCubelet(clientX, clientY), cubeletseenas, f, matname, N, angle = -1;

        if (null == target) return;

        cubeletseenas = rubikcube.getCubeletSeenCoords(target.cubelet);
        f = rubikcube.getFacesAsSeen(target.cubelet);

        if (null == f) return;

        matname = target.cubelet.geometry.materials[target.face.materialIndex].name;

        released_cub = {
            cub: target.cubelet,
            seenas: {
                name: f.faceseenas[matname],
                xx: cubeletseenas.xx,
                yy: cubeletseenas.yy,
                zz: cubeletseenas.zz
            }
        };
        if (pressed_cub.seenas.name === released_cub.seenas.name)
        {
            N = rubikcube.rubik.N;
            angle = -1;

            //console.log(pressed_cub.seenas.name, pressed_cub.seenas.xx, pressed_cub.seenas.yy, pressed_cub.seenas.zz);
            //console.log(released_cub.seenas.name, released_cub.seenas.xx, released_cub.seenas.yy, released_cub.seenas.zz);
            switch(pressed_cub.seenas.name)
            {
                case 'right':
                case 'left':
                    if (range(pressed_cub.seenas.yy, 0, N-1) && range(released_cub.seenas.yy, 0, N-1))
                    {
                        if ('left' === pressed_cub.seenas.name) angle = -angle;
                        if (released_cub.seenas.zz < pressed_cub.seenas.zz) angle = -angle;
                        rubikcube.rotate({axis:"y",row:pressed_cub.seenas.yy,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (range(pressed_cub.seenas.zz, 0, N-1) && range(released_cub.seenas.zz, 0, N-1))
                    {
                        if ('right' === pressed_cub.seenas.name) angle = -angle;
                        if (released_cub.seenas.yy < pressed_cub.seenas.yy) angle = -angle;
                        rubikcube.rotate({axis:"z",row:pressed_cub.seenas.zz,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.yy === N-1 && released_cub.seenas.yy === N-1)
                    {
                        angle = -angle;
                        if (released_cub.seenas.zz < pressed_cub.seenas.zz) angle = -angle;
                        rubikcube.rotate({axis:"x",row:pressed_cub.seenas.xx,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.yy === 0 && released_cub.seenas.yy === 0)
                    {
                        angle = -angle;
                        if (released_cub.seenas.zz < pressed_cub.seenas.zz) angle = -angle;
                        rubikcube.rotate({axis:"x",row:pressed_cub.seenas.xx,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.zz === 0 && released_cub.seenas.zz === 0)
                    {
                        angle = -angle;
                        if (released_cub.seenas.yy < pressed_cub.seenas.yy) angle = -angle;
                        rubikcube.rotate({axis:"x",row:pressed_cub.seenas.xx,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.zz === N-1 && released_cub.seenas.zz === N-1)
                    {
                        angle = -angle;
                        if (released_cub.seenas.yy < pressed_cub.seenas.yy) angle = -angle;
                        rubikcube.rotate({axis:"x",row:pressed_cub.seenas.xx,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    break;
                case 'top':
                case 'bottom':
                    if (range(pressed_cub.seenas.zz, 0, N-1) && range(released_cub.seenas.zz, 0, N-1))
                    {
                        if ('bottom' === pressed_cub.seenas.name) angle = -angle;
                        if (released_cub.seenas.xx < pressed_cub.seenas.xx) angle = -angle;
                        rubikcube.rotate({axis:"z",row:pressed_cub.seenas.zz,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (range(pressed_cub.seenas.xx, 0, N-1) && range(released_cub.seenas.xx, 0, N-1))
                    {
                        if ('bottom' === pressed_cub.seenas.name) angle = -angle;
                        if (released_cub.seenas.zz < pressed_cub.seenas.zz) angle = -angle;
                        rubikcube.rotate({axis:"x",row:pressed_cub.seenas.xx,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.zz === N-1 && released_cub.seenas.zz === N-1)
                    {
                        if (released_cub.seenas.xx < pressed_cub.seenas.xx) angle = -angle;
                        rubikcube.rotate({axis:"y",row:pressed_cub.seenas.yy,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.zz === 0 && released_cub.seenas.zz === 0)
                    {
                        if (released_cub.seenas.xx < pressed_cub.seenas.xx) angle = -angle;
                        rubikcube.rotate({axis:"y",row:pressed_cub.seenas.yy,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.xx === N-1 && released_cub.seenas.xx === N-1)
                    {
                        angle = -angle;
                        if (released_cub.seenas.zz < pressed_cub.seenas.zz) angle = -angle;
                        rubikcube.rotate({axis:"y",row:pressed_cub.seenas.yy,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.xx === 0 && released_cub.seenas.xx === 0)
                    {
                        angle = -angle;
                        if (released_cub.seenas.zz < pressed_cub.seenas.zz) angle = -angle;
                        rubikcube.rotate({axis:"y",row:pressed_cub.seenas.yy,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    break;
                case 'back':
                case 'front':
                    if (range(pressed_cub.seenas.yy, 0, N-1) && range(released_cub.seenas.yy, 0, N-1))
                    {
                        if ('back' === pressed_cub.seenas.name) angle = -angle;
                        if (released_cub.seenas.xx < pressed_cub.seenas.xx) angle = -angle;
                        rubikcube.rotate({axis:"y",row:pressed_cub.seenas.yy,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (range(pressed_cub.seenas.xx, 0, N-1) && range(released_cub.seenas.xx, 0, N-1))
                    {
                        if ('back' === pressed_cub.seenas.name) angle = -angle;
                        if (released_cub.seenas.yy < pressed_cub.seenas.yy) angle = -angle;
                        rubikcube.rotate({axis:"x",row:pressed_cub.seenas.xx,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.yy === N-1 && released_cub.seenas.yy === N-1)
                    {
                        angle = -angle;
                        if (released_cub.seenas.xx < pressed_cub.seenas.xx) angle = -angle;
                        rubikcube.rotate({axis:"z",row:pressed_cub.seenas.zz,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.yy === 0 && released_cub.seenas.yy === 0)
                    {
                        angle = -angle;
                        if (released_cub.seenas.xx < pressed_cub.seenas.xx) angle = -angle;
                        rubikcube.rotate({axis:"z",row:pressed_cub.seenas.zz,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.xx === N-1 && released_cub.seenas.xx === N-1)
                    {
                        if (released_cub.seenas.yy < pressed_cub.seenas.yy) angle = -angle;
                        rubikcube.rotate({axis:"z",row:pressed_cub.seenas.zz,angle:-angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    else if (pressed_cub.seenas.xx === 0 && released_cub.seenas.xx === 0)
                    {
                        if (released_cub.seenas.yy < pressed_cub.seenas.yy) angle = -angle;
                        rubikcube.rotate({axis:"z",row:pressed_cub.seenas.zz,angle:angle,duration:1/*,onComplete:updateflatimage*/});
                    }
                    break;
            }
        }
        if (isTouch)
        {
            //container.removeEventListener('touchmove', onDocumentTouchMove, false);
            container.removeEventListener('touchend', onDocumentTouchEnd, false);
            container.removeEventListener('touchcancel', onDocumentTouchEnd, false);
        }
        else
        {
            //container.removeEventListener('mousemove', onDocumentMouseMove, false);
            container.removeEventListener('mouseup', onDocumentMouseUp, false);
            container.removeEventListener('mouseout', onDocumentMouseOut, false);
        }
    }
}

function onDocumentMouseOut(event)
{
    isCubeRotation = false;
    container.removeEventListener('mousemove', onDocumentMouseMove, false);
    container.removeEventListener('mouseup', onDocumentMouseUp, false);
    container.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function animate()
{
    // sperical coordinate system for camera, with radius = rad
    camera.position.x = rad * Math.sin(targetRotationY * multy) * Math.cos(targetRotationX * multx);
    camera.position.y = rad * Math.sin(targetRotationX * multx);
    camera.position.z = rad * Math.cos(targetRotationY * multy) * Math.cos(targetRotationX * multx);
    camera.lookAt(scene.position);
    TWEEN.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function setDimensions()
{
    w = Math.min(window.innerWidth, 2000)-20;
    h = Math.max(window.innerHeight-150, 650);
    w2 = w / 2;
    h2 = h / 2;
    container.style.width = String(w)+"px";
    container.style.height = String(h)+"px";
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

var self = {
    init : function() {

        //cs_init();

        container = document.getElementById('container');
        newbt = document.getElementById('newrubik');
        scramblebt = document.getElementById('scramble');
        undobt = document.getElementById('undo');
        flatimage = document.getElementById('flatimage');
        rubikN = document.getElementById('rubik-type');

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(70, 1.0, 1, 1000);
        camera.position.z = rad;
        scene.add(camera);

        projector = new THREE.Projector();

        // Rubik Cube
        rubikcube = new Rubik(rubikN.options[rubikN.selectedIndex || 0].value, 200, 0.1, colors);
        scene.add(rubikcube);
        rubikcube.onChange = updateflatimage;

        renderer = new THREE.CanvasRenderer();
        setDimensions();
        container.appendChild(renderer.domElement);

        window.addEventListener('resize', setDimensions, false);
        container.addEventListener('mousedown', onDocumentMouseDown, false);
        container.addEventListener('touchstart', onDocumentTouchStart, false);
        newbt.addEventListener('click', function() {
            if (rubikcube) scene.remove(rubikcube);
            rubikcube = new Rubik(rubikN.options[rubikN.selectedIndex || 0].value, 200, 0.1, colors);
            scene.add(rubikcube);
            rubikcube.onChange = updateflatimage;
            renderer.render(scene, camera);
            updateflatimage();
        }, false);
        scramblebt.addEventListener('click', function() {
            rubikcube.scramble(10);
            updateflatimage();
        }, false);
        undobt.addEventListener('click', function() {
            if (rubikcube.undo() == 'setRubikColors')
            {
                colors = {
                    front: rubikcube.rubik.colors.front,
                    back: rubikcube.rubik.colors.back,
                    left: rubikcube.rubik.colors.left,
                    right: rubikcube.rubik.colors.right,
                    top: rubikcube.rubik.colors.top,
                    bottom: rubikcube.rubik.colors.bottom,
                    inside: rubikcube.rubik.colors.inside
                };
                //updatecolors();
                //updateflatimage();
            }
        }, false);

        // after render works
        renderer.render(scene, camera);
        updateflatimage();

        requestAnimationFrame(animate);
    },
    //cs_init: cs_init,
    animate : animate
};

// export it
window.RubikApplication = self;
})(window);