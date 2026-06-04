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
    toString = Object[proto].toString,
    perf = ("undefined" !== typeof global) && ('[object global]' === toString.call(global)) ? require('node:perf_hooks').performance : performance
;

var tweens = [];
function tick()
{
    if (tweens.length)
    {
        var now = perf.now();
        tweens = tweens.reduce(function(tweens, tween) {
            tween.tick(now);
            if (tween.finished()) tween.dequeue();
            else tweens.push(tween);
            return tweens;
        }, []);
    }
}

function Tween(obj)
{
    if (!(this instanceof Tween)) return new Tween(obj);
    var self = this, fps = 60, tween, timer, tick, stopped = false, enqueued = false;

    if (is_obj(obj)) tween = [];
    else obj = null;

    tick = function(now) {
        if (!tween || !tween.length)
        {
            if (timer)
            {
                clearInterval(timer);
                timer = null;
            }
            return;
        }
        if (null == now) now = perf.now();
        var completed = 0;
        tween.forEach(function(tween) {
            if (stopped)
            {
                return;
            }
            if (null == tween.startoftime)
            {
                tween.startoftime = now;
            }
            if (tween.time > tween.time1)
            {
                ++completed;
                return;
            }
            tween.time = now - tween.startoftime;
            if (tween.time < tween.time0)
            {
                return;
            }

            var kframes = tween.keyframes.length,
                kframe = tween.keyframe,
                time = tween.time,
                time0 = tween.time0,
                time1 = tween.time1,
                kf, t;
            while (kframe < kframes)
            {
                if (0 > tween.dir)
                {
                    kf = tween.keyframes[kframes - 1 - kframe];
                    if (
                        (time1 - kf.time < time) &&
                        (kframe+1 < kframes) &&
                        (time1 - tween.keyframes[kframes - 1 - kframe - 1].time < time)
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
                        (kf.time < time) &&
                        (kframe+1 < kframes) &&
                        (tween.keyframes[kframe+1].time < time)
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

            t = clamp(0 < time1 - time0 ? (time - time0) / (time1 - time0) : 1, 0, 1);
            if (0 > tween.dir)
            {
                if (0 > tween.easingdir)
                {
                    t = 1 - tween.easing(t);
                }
                else
                {
                    t = tween.easing(1 - t);
                }
            }
            else
            {
                t = tween.easing(t);
            }
            if (1 < kframes) t = (kframes)*(t - kframe/(kframes));
            obj[tween.prop] = kf.path(t);

            if ((time >= time0) && !tween.started)
            {
                tween.started = true;
                if (tween.start) tween.start(obj, self);
            }
            if (tween.progress)
            {
                tween.progress(obj, self);
            }
            if (time >= time1)
            {
                tween.time = time1+1;
                if (tween.end) tween.end(obj, self);
            }
            if (tween.time > tween.time1)
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
                var time1 = duration + delay,
                    time0 = delay;
                keyframes = Object.keys(keyframes).map(function(key) {
                    var path = keyframes[key];
                    return {
                        time: time0 + clamp(parseFloat(key.split('-')[0].trim()) || 0, 0, 100) * (time1 - time0) / 100,
                        path: is_callable(path) ? path : (is_obj(path) && HAS.call(path, 'from') && HAS.call(path, 'to') ? line(path['from'], path['to']) : path)
                    };
                }).sort(function(kf1, kf2) {
                    return kf1.time - kf2.time;
                });
                keyframes = keyframes.reduce(function(kframes, kf, i) {
                    if (kf.time < time1)
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
                        easingdir: 1,
                        startoftime: null,
                        time0: time0,
                        time1: time1,
                        time: 0,
                        keyframe: 0,
                        started: false,
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
            if (enqueued)
            {
                return self;
            }
            if (timer)
            {
                clearInterval(timer);
                timer = null;
            }
            self.rewind();
            stopped = false;
            if ("immediately" === immediately) tick();
            timer = setInterval(function() {tick();}, 1000 / fps);
        }
        return self;
    };
    self.enqueue = function() {
        if (tween && tween.length)
        {
            if (timer)
            {
                clearInterval(timer);
                timer = null;
            }
            if (!enqueued)
            {
                enqueued = true;
                tweens.push(self);
            }
        }
        return self;
    };
    self.dequeue = function() {
        enqueued = false;
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
    self.reverse = function(opts) {
        if (tween && tween.length)
        {
            opts = opts || {};
            tween.forEach(function(tween) {
                tween.dir = -tween.dir;
                tween.easingdir = opts.easing ? -1 : 1;
            });
        }
        return self;
    };
    self.rewind = function() {
        if (tween && tween.length)
        {
            tween.forEach(function(tween) {
                tween.keyframe = 0;
                tween.time = 0;
                tween.startoftime = null;
                tween.started = false;
            });
        }
        return self;
    };
    self.resume = function() {
        if (!self.finished())
        {
            stopped = false;
            if (!enqueued && !timer) timer = setInterval(function() {tick();}, 1000 / fps);
        }
        return self;
    };
    self.update = function() {
        // manual updating
        if (tween && tween.length && !stopped && !enqueued) tick();
        return self;
    };
    self.tick = function(now) {
        // enqueued updating
        if (tween && tween.length && !stopped) tick(now);
        return self;
    };
    self.finished = function() {
        return 0 === (tween || []).filter(function(tween) {return tween.time <= tween.time1;}).length;
    };
    self.fps = function(new_fps) {
        if (arguments.length)
        {
            fps = new_fps;
            return self;
        }
        else
        {
            return fps;
        }
    };
}
Tween[proto] = {
    constructor: Tween,
    dispose: null,
    animate: null,
    start: null,
    enqueue: null,
    dequeue: null,
    stop: null,
    initialize: null,
    finalize: null,
    reverse: null,
    rewind: null,
    resume: null,
    update: null,
    tick: null,
    finished: null,
    fps: null
};
def(Tween, 'tick', {
    get: function() {return tick;},
    set: function() {},
    enumerable: true,
    configurable: false
});

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