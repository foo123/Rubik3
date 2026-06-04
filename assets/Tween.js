/**
*
* Tween.js
* A versatile and performant Tween API
*
* @version 1.0.0
* https://github.com/foo123/Tween.js
*
**/
!function(root, name, factory) {
"use strict";
if (('object' === typeof module) && module.exports) /* CommonJS */
    module.exports = factory.call(root);
else if (('function' === typeof define) && define.amd && ('function' === typeof require) && ('function' === typeof require.specified) && require.specified(name) /*&& !require.defined(name)*/) /* AMD */
    define(name, ['module'], function(module) {return factory.call(root);});
else if (!(name in root)) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root)||1) && ('function' === typeof(define)) && define.amd && define(function() {return root[name];});
}(/* current root */          'undefined' !== typeof self ? self : this,
  /* module name */           "Tween",
  /* module factory */        function ModuleFactory__Tween(undef) {
"use strict";

var VERSION = "1.0.0",
    proto = 'prototype',
    stdMath = Math,
    PI = stdMath.PI,
    TWO_PI = 2*PI,
    INF = Infinity,
    def = Object.defineProperty,
    HAS = Object[proto].hasOwnProperty,
    toString = Object[proto].toString;

function Tween(obj, fps)
{
    if (!(this instanceof Tween)) return new Tween(obj, fps);
    var self = this, tween, timer, animate, stopped = false;

    fps = fps || 60;
    if (is_obj(obj)) tween = [];
    else obj = null;

    animate = function() {
        if (!tween || !tween.length)
        {
            if (timer)
            {
                clearInterval(timer);
                timer = null;
            }
            return;
        }
        var completed = 0;
        tween.forEach(function(tween) {
            if (stopped) return;
            if (tween.frame > tween.frames)
            {
                ++completed;
                return;
            }
            else if (tween.frame < tween.frame0)
            {
                ++tween.frame;
                return;
            }

            var kframes = tween.keyframes.length,
                frames = tween.frames,
                kframe = tween.keyframe,
                frame = tween.frame,
                frame0 = tween.frame0,
                kf, t;
            while (kframe < kframes)
            {
                if (0 > tween.dir)
                {
                    kf = tween.keyframes[kframes - 1 - kframe];
                    if (
                        (frames - 1 - kf.frame < frame) &&
                        (kframe+1 < kframes) &&
                        (frames - 1 - tween.keyframes[kframes - 1 - kframe - 1].frame < frame)
                    )
                    {
                        ++kframe;
                    }
                    else
                    {
                        break;
                    }
                }
                else
                {
                    kf = tween.keyframes[kframe];
                    if (
                        (kf.frame < frame) &&
                        (kframe+1 < kframes) &&
                        (tween.keyframes[kframe+1].frame < frame)
                    )
                    {
                        ++kframe;
                    }
                    else
                    {
                        break;
                    }
                }
            }
            tween.keyframe = kframe;
            ++tween.frame;

            t = clamp(1 < frames - frame0 ? (frame - frame0) / (frames - 1 - frame0) : 1, 0, 1);
            t = tween.easing(0 > tween.dir ? (1 - t) : t);
            if (1 < kframes) t = (kframes)*(t - kframe/(kframes));
            obj[tween.prop] = kf.path(t);

            if ((frame0 === frame) && tween.start)
            {
                tween.start(obj, self);
            }
            if (tween.progress)
            {
                tween.progress(obj, self);
            }
            if ((frame+1 >= frames) && tween.end)
            {
                tween.frame = frames+1;
                tween.end(obj, self);
            }
            if (tween.frame > tween.frames)
            {
                ++completed;
            }
        });
        if (tween && (completed === tween.length) && timer)
        {
            clearInterval(timer);
            timer = null;
        }
    };

    self.dispose = function() {
        tween = null;
        obj = null;
    };
    self.animate = function(prop, keyframes, duration, delay, easing, opts) {
        if (tween && is_string(prop))
        {
            if (is_obj(keyframes) && HAS.call(keyframes, 'from') && HAS.call(keyframes, 'to'))
            {
                keyframes = {
                    "0%-100%": line(keyframes['from'], keyframes['to'])
                };
            }
            else if (is_callable(keyframes))
            {
                keyframes = {
                    "0%-100%": keyframes
                };
            }
            if (is_obj(keyframes))
            {
                if (is_string(easing)) easing = Tween.Easing[easing];
                easing = is_callable(easing) ? easing : Tween.Easing.linear;
                delay = stdMath.max(0, (+delay) || 0);
                duration = stdMath.max(0, (+duration) || 0);
                var frames = stdMath.ceil((duration + delay) * fps / 1000),
                    frame0 = stdMath.round(delay * fps / 1000);
                keyframes = Object.keys(keyframes).map(function(key) {
                    var path = keyframes[key];
                    return {
                        frame: frame0 + stdMath.round(clamp(parseFloat(key.split('-')[0].trim()) || 0, 0, 100) * (frames - 1 - frame0) / 100),
                        path: is_callable(path) ? path : (is_obj(path) && HAS.call(path, 'from') && HAS.call(path, 'to') ? line(path['from'], path['to']) : path)
                    };
                }).sort(function(kf1, kf2) {
                    return kf1.frame - kf2.frame;
                });
                keyframes = keyframes.reduce(function(kframes, kf, i) {
                    if (kf.frame < frames-1)
                    {
                        if (!is_callable(kf.path))
                        {
                            if (i+1 < keyframes.length)
                            {
                                kf.path = line(kf.path, is_callable(keyframes[i+1].path) ? keyframes[i+1].path(0) : keyframes[i+1].path);
                            }
                            else if (i-1 >= 0)
                            {
                                kf.path = line(is_callable(keyframes[i-1].path) ? keyframes[i-1].path(1) : keyframes[i-1].path, kf.path);
                            }
                            else
                            {
                                kf.path = line(kf.path, kf.path);
                            }
                        }
                        kframes.push(kf);
                    }
                    return kframes;
                }, []);
                if (keyframes.length)
                {
                    tween.push({
                        prop: prop,
                        keyframes: keyframes,
                        duration: duration,
                        delay: delay,
                        easing: easing,
                        dir: 1,
                        frames: frames,
                        frame0: frame0,
                        frame: 0,
                        keyframe: 0,
                        start: opts && is_callable(opts.onStart) ? opts.onStart : null,
                        progress: opts && is_callable(opts.onProgress) ? opts.onProgress : null,
                        end: opts && is_callable(opts.onEnd) ? opts.onEnd : null
                    });
                }
            }
        }
        return self;
    };
    self.start = function(immediately) {
        if (tween && tween.length)
        {
            if (timer)
            {
                clearInterval(timer);
                timer = null;
            }
            self.rewind();
            stopped = false;
            if ("immediately" === immediately) animate();
            timer = setInterval(animate, 1000 / fps);
        }
        return self;
    };
    self.stop = function(stop) {
        if (stop || !arguments.length)
        {
            if (timer)
            {
                clearInterval(timer);
                timer = null;
            }
            stopped = true;
        }
        else if (arguments.length && !stop)
        {
            stopped = false;
        }
        return self;
    };
    self.initialize = function() {
        if (tween && tween.length)
        {
            tween.forEach(function(tween) {
                obj[tween.prop] = tween.keyframes[0 > tween.dir ? (tween.keyframes.length-1) : 0].path(0 > tween.dir ? 1 : 0);
            });
        }
        return self;
    };
    self.finalize = function() {
        if (tween && tween.length)
        {
            tween.forEach(function(tween) {
                obj[tween.prop] = tween.keyframes[0 > tween.dir ? 0 : (tween.keyframes.length-1)].path(0 > tween.dir ? 0 : 1);
            });
        }
        return self;
    };
    self.reverse = function() {
        if (tween && tween.length)
        {
            tween.forEach(function(tween) {
                tween.dir = -tween.dir;
            });
        }
        return self;
    };
    self.rewind = function() {
        if (tween && tween.length)
        {
            tween.forEach(function(tween) {
                tween.keyframe = 0;
                tween.frame = 0;
            });
        }
        return self;
    };
    self.resume = function() {
        if (!self.finished())
        {
            stopped = false;
            if (!timer) timer = setInterval(animate, 1000 / fps);
        }
        return self;
    };
    self.update = function() {
        // manual updating
        if (tween && tween.length && !stopped) animate();
        return self;
    };
    self.finished = function() {
        return 0 === (tween || []).filter(function(tween) {return tween.frame <= tween.frames;}).length;
    };
    self.fps = function() {
        return fps;
    };
}
Tween[proto] = {
    constructor: Tween,
    dispose: null,
    animate: null,
    start: null,
    stop: null,
    initialize: null,
    finalize: null,
    reverse: null,
    rewind: null,
    resume: null,
    update: null,
    finished: null,
    fps: null
};

// https://easings.net/
function ease_out_bounce(t)
{
    var n1 = 7.5625, d1 = 2.75, t1;

    if (t < 1/d1)
    {
        return n1*t*t;
    }
    else if (t < 2/d1)
    {
        t1 = t - 1.5;
        return n1*(t1/d1)*t1 + 0.75;
    }
    else if (t < 2.5/d1)
    {
        t1 = t - 2.25;
        return n1*(t1/d1)*t1 + 0.9375;
    }
    t1 = t - 2.625
    return n1*(t1/d1)*t1 + 0.984375;
}
Tween.Easing = {
    // t is in [0, 1], 0=start, 1=end of animation
    'linear': function(t) {
        return t;
    },
    'ease-in-quad': function(t) {
        return t*t;
    },
    'ease-out-quad': function(t) {
        var tc = 1 - t;
        return 1 - tc*tc;
    },
    'ease-in-out-quad': function(t) {
        return t < 0.5 ? 2*t*t : (1 - stdMath.pow(2 - 2*t, 2)/2);
    },
    'ease-in-cubic': function(t) {
        return t*t*t;
    },
    'ease-out-cubic': function(t) {
        return 1 - stdMath.pow(1 - t, 3);
    },
    'ease-in-out-cubic': function(t) {
        return t < 0.5 ? 4*t*t*t : (1 - stdMath.pow(2 - 2*t, 3)/2);
    },
    'cubic-bezier': function(c0, c1, c2, c3) {
        return bezier(c0, c1, c2, c3);
    },
    'ease-in-expo': function(t) {
        return 0 === t ? 0 : stdMath.pow(2, 10*t - 10);
    },
    'ease-out-expo': function(t) {
        return 1 === t ? 1 : (1 - stdMath.pow(2, -10*t));
    },
    'ease-in-out-expo': function(t) {
        return 0 === t
              ? 0
              : (1 === t
              ? 1
              : (t < 0.5
              ? (stdMath.pow(2, 20*t - 10)/2)
              : ((2 - stdMath.pow(2, 10 - 20*t))/2)));
    },
    'ease-in-back': function(t) {
        var c1 = 1.70158, c3 = c1 + 1, t2 = t*t;
        return c3*t2*t - c1*t2;
    },
    'ease-out-back': function(t) {
        var c1 = 1.70158, c3 = c1 + 1, tc = t - 1;
        return 1 + c3*stdMath.pow(tc, 3) + c1*stdMath.pow(tc, 2);
    },
    'ease-in-out-back': function(t) {
        var c1 = 1.70158, c2 = c1*1.525;
        return t < 0.5
            ? ((stdMath.pow(2*t, 2)*((c2 + 1)*2*t - c2))/2)
            : ((stdMath.pow(2*t - 2, 2)*((c2 + 1)*(t*2 - 2) + c2) + 2)/2);
    },
    'ease-in-elastic': function(t) {
        return 0 === t
            ? 0
            : (1 === t
            ? 1
            : (-stdMath.pow(2, 10*t - 10)*stdMath.sin((t*10 - 10.75)*2*PI/3)));
    },
    'ease-out-elastic': function(t) {
        return 0 === t
          ? 0
          : (1 === t
          ? 1
          : (stdMath.pow(2, -10*t)*stdMath.sin((t*10 - 0.75)*2*PI/3) + 1));
    },
    'ease-in-out-elastic': function(t) {
        return 0 === t
          ? 0
          : (1 === t
          ? 1
          : (t < 0.5
          ? (-(stdMath.pow(2, 20*t - 10)*stdMath.sin((20*t - 11.125)*2*PI/4.5))/2)
          : ((stdMath.pow(2, -20*t + 10)*stdMath.sin((20*t - 11.125)*2*PI/4.5))/2 + 1)));
    },
    'ease-in-bounce': function(t) {
        return 1 - ease_out_bounce(1 - t);
    },
    'ease-out-bounce': function(t) {
        return ease_out_bounce(t);
    },
    'ease-in-out-bounce': function(t) {
        return t < 0.5
          ? ((1 - ease_out_bounce(1 - 2*t))/2)
          : ((1 + ease_out_bounce(2*t - 1))/2);
    }
};
Tween.Easing['ease-in'] = Tween.Easing['ease-in-quad'];
Tween.Easing['ease-out'] = Tween.Easing['ease-out-quad'];
Tween.Easing['ease'] = Tween.Easing['ease-in-out'] = Tween.Easing['ease-in-out-quad'];

function line(/*..args*/)
{
    var c = is_array(arguments[0]) ? arguments[0] : arguments,
        c0 = c[0] || 0,
        c1 = c[1] || 0;
    // 0 <= t <= 1
    return function(t) {
        return c0 * (1 - t) + c1 * t;
    };
}
function polyline(/*..args*/)
{
    var p = is_array(arguments[0]) ? arguments[0] : arguments, n = p.length - 1;
    // 0 <= t <= 1
    return 1 < n ? function(t) {
        var i = stdMath.floor((n-1)*t),
            pi0 = p[i], pi1 = p[i+1],
            ti = n*(t - i/n);
        return pi0 * (1 - ti) + pi1 * ti;
    } : line(p[0], p[1]);
}
function bezier(/*..args*/)
{
    var c = is_array(arguments[0]) ? arguments[0] : arguments,
        order = c.length - 1,
        c0 = c[0] || 0,
        c1 = (0 < order ? c[1] : c0) || 0,
        c2 = (1 < order ? c[2] : c1) || 0,
        c3 = (2 < order ? c[3] : c2) || 0
    ;
    // 0 <= t <= 1
    return (function(c0, c1, c2, c3) {
        return 3 <= order ? function(t) {
            // only up to cubic
           var t0 = t, t1 = 1 - t, t0t0 = t0*t0, t1t1 = t1*t1;
           return t1*t1t1*c0 + 3*t1t1*t0*c1 + 3*t1*t0t0*c2 + t0t0*t0*c3;
        } : (2 === order ? function(t) {
            // quadratic
           var t0 = t, t1 = 1 - t;
           return t1*t1*c0 + 2*t1*t0*c1 + t0*t0*c2;
        } : (1 === order ? function(t) {
            // linear
            return (1 - t)*c0 + t*c1;
        } : function(t) {
            // point
            return c0;
        }));
    })(c0, c1, c2, c3);
}
function arc(x1, y1, x2, y2, rx, ry, phi, large_arc, sweep)
{
    // Step 1: simplify through translation/rotation
    phi = phi || 0;
    if (null == ry) ry = rx;
    var fa = !!large_arc ? 1 : 0, fs = !!sweep ? 1 : 0,
        cos = stdMath.cos(phi), sin = stdMath.sin(phi),
        x =  cos*(x1 - x2)/2 + sin*(y1 - y2)/2,
        y = -sin*(x1 - x2)/2 + cos*(y1 - y2)/2,
        px = x*x, py = y*y, prx = rx*rx, pry = ry*ry,
        L = px/prx + py/pry;

    // correct out-of-range radii
    if (L > 1)
    {
        L = stdMath.sqrt(L);
        rx *= L;
        ry *= L;
        prx = rx*rx;
        pry = ry*ry;
    }

    // Step 2 + 3: compute center
    var M = stdMath.sqrt(stdMath.abs((prx*pry - prx*py - pry*px)/(prx*py + pry*px)))*(fa === fs ? -1 : 1),
        _cx = M*rx*y/ry,
        _cy = -M*ry*x/rx,

        cx = cos*_cx - sin*_cy + (x1 + x2)/2,
        cy = sin*_cx + cos*_cy + (y1 + y2)/2
    ;

    // Step 4: compute theta0 and dtheta
    var theta0 = cmod(vector_angle(1, 0, (x - _cx)/rx, (y - _cy)/ry)),
        dtheta = vector_angle((x - _cx)/rx, (y - _cy)/ry, (-x - _cx)/rx, (-y - _cy)/ry);
    dtheta -= stdMath.floor(dtheta/TWO_PI)*TWO_PI; // % 360

    if (!fs && dtheta > 0) dtheta -= TWO_PI;
    if (fs && dtheta < 0) dtheta += TWO_PI;

    var curr_t = -1, arc_x = 0, arc_y = 0;
    // 0 <= t <= 1
    var arc = function(t) {
        if (t !== curr_t)
        {
            var theta = theta0 + t * dtheta,
                x = rx * stdMath.cos(theta),
                y = ry * stdMath.sin(theta);
            curr_t = t;
            arc_x = cx + cos*x - sin*y;
            arc_y = cy + sin*x + cos*y;
        }
        return {x: arc_x, y: arc_y};
    };
    return {
        x: function(t) {return arc(t).x;},
        y: function(t) {return arc(t).y;},
    };
}
Tween.Path = {
    line: line,
    polyline: polyline,
    bezier: bezier,
    arc: arc
};

// utils ---------------------------------
function nop() {}
function is_callable(x)
{
    return "function" === typeof x;
}
function is_string(x)
{
    return "string" === typeof x;
}
function is_obj(x)
{
    return (null != x) && ("object" === typeof x);
}
function is_array(x)
{
    return "[object Array]" === toString.call(x);
}
function clamp(x, xmin, xmax)
{
    return stdMath.min(stdMath.max(x, xmin), xmax);
}
function sign(x)
{
    return 0 > x ? -1 : 1;
}
function crossp(x1, y1, x2, y2)
{
    return x1*y2 - y1*x2;
}
function dotp(x1, y1, x2, y2)
{
    return x1*x2 + y1*y2;
}
function angle(x1, y1, x2, y2)
{
    var n1 = stdMath.hypot(x1, y1), n2 = stdMath.hypot(x2, y2);
    if ((0 === n1) || (0 === n2)) return 0;
    return stdMath.acos(clamp(dotp(x1/n1, y1/n1, x2/n2, y2/n2), -1, 1));
}
function vector_angle(ux, uy, vx, vy)
{
    return sign(crossp(ux, uy, vx, vy))*angle(ux, uy, vx, vy);
}
function mod(x, m, xmin, xmax)
{
    x -= m*stdMath.floor(x/m);
    if (xmin > x) x += m;
    if (xmax < x) x -= m;
    return x;
}
function cmod(x)
{
    return mod(x, TWO_PI, 0, TWO_PI);
}

// export it
Tween.VERSION = VERSION;
return Tween;
});