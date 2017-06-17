var $ = require('./compose.js');
var tape = require('tape');

/**
 * Features:
 * Flatten
 * reduce
 * syntax error throwing
 * 
 * Todo:
 * Object support
 * Change mergesort to tiled mergesort
 * Need more tests for sort
 * Evaluate function for async (seq without deleting call stack)
 * Scan function or pairwise evluate
 * Unit tests for naive implementations (eg. Compose.map), especially for ones in use
 * Add more failure cases unit tests
 * Memory independence between seqs
 */

tape('Range test', function (t) {
  t.deepEqual($.range(6), [0,1,2,3,4,5], 'range single');
  t.deepEqual($.range(-3,5), [-3,-2,-1,0,1,2,3,4], 'range double negpos');
  t.deepEqual($.range(5,-3), [], 'range double posneg');
  t.deepEqual($.range(-9,-4), [-9,-8,-7,-6,-5], 'range double negneg');
  t.deepEqual($.range(-9,-13), [], 'range double negneg fail');
  t.deepEqual($.range(3,9), [3,4,5,6,7,8], 'range double pospos');
  t.deepEqual($.range(6,0), [], 'range double pospos fail');

  t.deepEqual($.range(-3,5,2), [-3,-1,1,3], 'range triple negpos 2');
  t.deepEqual($.range(-3,5,-2), [], 'range triple negpos -2');
  t.deepEqual($.range(5,-3, 2.5), [], 'range triple posneg 3');
  t.deepEqual($.range(5,-3, -2.5), [5,2.5,0,-2.5], 'range triple posneg -3');
  t.deepEqual($.range(-9,-4, 3), [-9,-6], 'range triple negneg 3');
  t.deepEqual($.range(-9,-4, -3), [], 'range triple negneg -3');
  t.deepEqual($.range(-1,-9, 1.5), [], 'range triple negneg 3');
  t.deepEqual($.range(-1,-9, -1.5), [-1,-2.5,-4,-5.5,-7,-8.5], 'range triple negneg -3');
  t.deepEqual($.range(3,9, 1.5), [3,4.5,6,7.5], 'range triple pospos 0.5');
  t.deepEqual($.range(3,9, 1.5), [3,4.5,6,7.5], 'range triple pospos -0.5');
  t.deepEqual($.range(6,0, 2.2), [], 'range triple pospos -1.5');
  // Following test has some floating point issues (do not get expected 1.6)
  t.deepEqual($.range(6,0, -2.2), [6,3.8,6-2.2-2.2], 'range triple pospos -1.5');
  t.end();
});

tape('General tests', function (t) {
  t.deepEqual(
    $([1,2,3,4,5,6]).map(x => x * 2).filter(x => x % 3 !== 0).map(x => x * 3).value(),
    [6,12,24,30], 'Basic: map |> filter |> map');
  t.deepEqual($($.range(-10,-30,-2)).take(5).value(),
    $.range(-10,-20,-2), 'range |> take');
  t.deepEqual($($.range(-10,-30,-2)).take(10)
    .filter((x, i) => i % 3 !== 0).take(3).value(),
    [-12,-14,-18], 'range |> take |> filter |> take');
  t.deepEqual($($.range(5,30,3)).map((x, i) => i).value(),
    $.range(9), 'Map index 1');
  t.deepEqual($($.range(10)).map((x, i) => x + i).value(),
    $($.range(10)).map(x => x * 2).value(), 'Map index 2');
  t.deepEqual($($.range(5,30)).filter((x, i) => i % 2 === 0).value(),
    $.range(5,30,2), 'Filter index');
  t.deepEqual($($.range(10))
    .map(x => x * 2).filter((x, i) => i % 3 !== 0).map(x => x * 3).seq()
    .map(x => x * 2).filter((x, i) => i % 3 !== 0).map(x => x * 3).value(),
    [72,144,252,288],
    'Double seq test with map and filter');
  t.deepEquals($($.range(20,10,-1)).sort((x, y) => x - y, 'unstable').value(),
    $.range(11,21), 'range |> sort');
  t.deepEquals($($.range(20,10,-1)).sort((x, y) => x - y, 'stableInsert').value(),
    $.range(11,21), 'range |> sort');
  t.deepEquals($($.range(20,10,-1)).sort((x, y) => x - y, 'stableMerge').value(),
    $.range(11,21), 'range |> sort');
  
  var es6IteratorTest = [];
  for (var entry of $($.range(10)).map(x => x * 2).filter(x => x % 3 !== 0).map(x => x * 3)) {
    es6IteratorTest.push(entry[0]);
  }
  t.deepEqual(es6IteratorTest,[6,12,24,30,42,48], 'ES6 Iterator Test');


  t.end();
});

tape('Naive Method Tests', function (t) {
  t.deepEqual($.map(x => x * 2, $.range(5,15)),
    $.range(10,30,2),'Naive map');
  t.deepEqual($.map((x, i) => x * i, $.range(-6,2)),
    [0,-5,-8,-9,-8,-5,0,7],'Naive map with index');
  t.deepEqual($.map(
    (x, i, a) =>
      (x % a.length + a.length) % a.length,
    $.range(-6,2)),
    [2,3,4,5,6,7,0,1],'Naive map with index and array');
  
  t.deepEqual($.filter(x => x % 2 === 0, $.range(-5,-15, -1)),
    $.range(-6,-15,-2),'Naive filter');
  t.deepEqual($.filter((x, i) => i % 3 === 0, $.range(-5,-15, -1)),
    $.range(-5,-15,-3),'Naive filter with index');
  t.deepEqual($.filter((x, i, a) => a[i * i % a.length] % 3 === 0, $.range(-5,-15, -1)),
    [-6,-7,-13,-14],'Naive filter with index and array');
  var filterIndependenceTest = $.range(-13,0);
  $.filter(x => x % 2, filterIndependenceTest);
  t.deepEqual(filterIndependenceTest,
    $.range(-13,0),'Naive filter with index and array');

  
  t.deepEqual($.reduce((a, x) => a + x, 0, $.range(-5,-15, -1)),
    (-5 - 14) * 10 / 2,'Naive reduce, sum');
  t.deepEqual($.reduce((a, x) => { a.push(x); return a; }, [], $.range(-5,5)),
    $.range(-5,5),'Naive reduce, push');
  t.deepEqual($.reduce((a, x) => { a.unshift(x); return a; }, [], $.range(-5,5)),
    $.range(4,-6,-1),'Naive reduce unshift');
  t.deepEqual($.reduce((a, x) => a + x, 0, $.range(-5,-15, -1)),
    (-5 - 14) * 10 / 2,'Naive reduce, sum');
  t.deepEqual($.reduce((a, x, i) => a + x + i, 0, $.range(-20,-10)),
    (-20-11)*10/2 + (0+9)*10/2,'Naive reduce with index');
  t.deepEqual($.reduce((a, x, i, l) => a + l[l.length - i - 1] + x, 0, $.range(-20,-10)),
    (-20-11) * 10,'Naive reduce with index and array');

  t.deepEqual($.reverse($.range(2,12,2)),
    $.range(10,1,-2),'Naive reverse');
  
  t.end();
});

tape('Flatten Test', function (t) {
  var flattenTest = [1, [2, [3, [4]], 5]];
  t.deepEqual($(flattenTest).flatten(1).value(), [1,2,[3,[4]],5], 'level 1');
  t.deepEqual($(flattenTest).flatten(2).value(), [1,2,3,[4],5], 'level 2');
  t.deepEqual($(flattenTest).flatten(3).value(), [1,2,3,4,5], 'level 3');
  t.deepEqual($(flattenTest).flattenDeep().value(), [1,2,3,4,5], 'deep');
  t.end();
});

tape('Reduce tests', function (t) {
  t.deepEqual($($.range(0, 10, 2)).reduce((a, x) => a + x, 0).value(),
    [20],
    'range |> reduce sum');
  t.deepEqual($($.range(0, 10, 2))
    .reduce((a, x) => { a.push(x); return a; }, [])
    .value(),
    [[0,2,4,6,8]],
    'range |> reduce append ');
  t.deepEqual($($.range(0, 20, 2))
    .map(x => x * 2)
    .reduce((a, x) => { a.push(x + 1); return a; }, [])
    .flatten(1)
    .filter(x => x % 3 !== 0)
    .value(),
    [1,5,13,17,25,29,37],
    'range |> map |> reduce |> flatten |> filter');
  t.deepEqual($($.range(-10, 20, 2))
    .reduce((a, x, i) => { a.push(i); return a; }, []).flatten(1)
    .map(x => x * 2).value(),
    $.range(0, 30, 2),
    'index test 1, range |> reduce |> flatten |> map');
  t.deepEqual($($.range(0, 10)).map(x => x * 2)
    .reduce((a, x, i) => { a.push(x + i); return a; }, []).flatten(1)
    .map(x => x * 2).value(),
    $.range(0, 55, 6),
    'index test 2, range |> map |> reduce |> flatten |> map');
  t.deepEqual($($.range(10, 20)).map(x => x / 2)
    .reduce((a, x, i) => { a.push(x + i); return a; }, []).flatten(1)
    .map(x => x * 2).value(),
    $.range(10, 38, 3),
    'index test 3, range |> map |> reduce |> flatten |> map');
  t.end();
});

tape('Chunk Number Test', function (t) {
  t.deepEqual(
    $([1,2,3,4,5,6,7]).map(x => x * 2)
      .chunk(3).value(),
    [[2,4,6],[8,10,12],[14]],
    'map |> chunk number');
  t.deepEqual(
    $([1,2,3,4,5,6,7]).map(x => x * 2)
      .chunk((x, i) => i * i > x).value(),
    [[2,4,6, 8],[10],[12],[14]],
    'map |> chunk(function)');
  t.deepEqual($([]).map(x => x * 2).chunk(3).value(), [],
    'Empty |> map |> chunk(three)');
  t.deepEqual($([]).chunk(0).reverse().value(), [],
    'Empty |> chunk(0) |> reverse');
  t.deepEqual($([]).chunk(1).reverse().value(), [],
    'Empty |> chunk(one) |> reverse');
  t.deepEqual(
    $([1,2,3,4,5,6,7]).map(x => x * 2).chunk(0).value(),
    [[2,4,6,8,10,12,14]],
    'map |> chunk(zero)');
  t.deepEqual($([1,2,3,4,5]).chunk(0).reverse().value(), [[1,2,3,4,5]],
    'chunk(zero) |> reverse');

    
  t.deepEqual($([1,2,3,4,5]).chunk(1).value(), [[1],[2],[3],[4],[5]],
    'chunk(1)');
  t.deepEqual($([1,2,3,4,5]).chunk(1).reverse().value(), [[5],[4],[3],[2],[1]],
    'chunk(1) |> reverse');
  t.deepEqual($([1,2,3,4,5]).chunk(2).reverse().value(), [[5], [3,4], [1,2]],
    'odd input |> chunk (2) |> reverse');
  t.deepEqual($([1,2,3,4,5,6]).chunk(2).reverse().value(), [[5,6],[3,4],[1,2]],
    'even input |> chunk (2) |> reverse');

  t.deepEqual($($.range(7)).chunk(3).value(), [[0,1,2], [3,4,5], [6]],
    '7 inputs |> chunk (3)');
  t.deepEqual($($.range(8)).chunk(3).value(), [[0,1,2], [3,4,5], [6,7]],
    '8 inputs |> chunk (3)');
  t.deepEqual($($.range(9)).chunk(3).value(), [[0,1,2], [3,4,5], [6,7,8]],
    '9 inputs |> chunk (3)');
  t.deepEqual($($.range(7)).chunk(3).reverse().value(), [[6],[3,4,5],[0,1,2]],
    [[5], [3,4], [1,2]],
    '7 inputs |> chunk (3) |> reverse');
  t.deepEqual($($.range(8)).chunk(3).reverse().value(), [[6,7],[3,4,5],[0,1,2]],
    '8 inputs |> chunk (3) |> reverse');
  t.deepEqual($($.range(9)).chunk(3).reverse().value(), [[6,7,8],[3,4,5],[0,1,2]],
    '9 inputs |> chunk (3) |> reverse');

  t.end();
});

tape('Zip Tests', function (t) {
  t.deepEqual($([1,2,3,4,5,6]).zip([7,1,4,3,1,5]).value(),
    [[1,7],[2,1],[3,4],[4,3],[5,1],[6,5]],
    'zip');
  t.deepEqual($($.range(5)).zip($.range(-8, 0)).value(),
    [[0,-8],[1,-7],[2,-6],[3,-5],[4,-4],[undefined,-3],[undefined,-2],[undefined, -1]],
    'range |> zip(longer range)');
  t.deepEqual($($.range(-8, 0)).zip($.range(5)).value(),
    [[-8,0],[-7,1],[-6,2],[-5,3],[-4,4],[-3,undefined],[-2,undefined],[-1,undefined]],
    'longer range |> zip(range)');
  t.deepEqual($($.range(0,5)).zip($.range(5,10), $.range(-5,0)).value(),
    [[0,5,-5], [1,6,-4], [2,7,-3], [3,8,-2], [4,9,-1]],
    'range |> zip(range, range)');
  t.deepEqual($($.range(0,5)).zip($.range(5,10)).zip($.range(-5,0)).value(),
    [[[0,5],-5], [[1,6],-4], [[2,7],-3], [[3,8],-2], [[4,9],-1]],
    'range |> zip(range) |> zip(range)');
  t.end();
});

tape('Reverse tests', function (t) {
  t.deepEqual($($.range(1,50,1)).reverse().value(),
    $.range(49,0,-1), 'range |> reverse');
  t.deepEqual($($.range(-30,100,3)).reverse().reverse().value(),
    $.range(-30,100,3), 'range |> reverse |> reverse');
  t.deepEqual($($.range(10))
    .filter(x => x % 2 == 0)
    .reverse().value(),
    [8,6,4,2,0],
    'range |> filter |> reverse');
  t.deepEqual($($.range(10))
    .map(x => x * 2)
    .reverse().value(),
    [18,16,14,12,10,8,6,4,2,0],
    'range |> map |> reverse');
  t.deepEqual($($.range(10))
    .filter(x => x % 2 == 0)
    .map(x => x * 2)
    .reverse().value(),
    [16,12,8,4,0],
    'range |> filter |> reverse');
  t.deepEqual($([1, [2, [3, [4]], 5]])
    .flattenDeep()
    .map(x => x * 2)
    .reverse().value(),
    [10,8,6,4,2],
    'flattenDeep |> map |> reverse');
  t.deepEqual($($.range(10))
    .reverse()
    .map(x => x * 2)
    .chunk(2)
    .reverse().value(),
    [[2, 0],[6, 4],[10,8],[14,12],[18,16]],
    'range |> reverse |> map |> chunk |> reverse');
  t.deepEqual($(
    [ { first: 'qwerty', second: 'yoyo' },
      { first: '', second: 'the cat' }, 
      { first: '', second: 'in the hat' },
      { first: '', second: 'is nearly like that' },
      { first: 'asdf', second: 'the brown dog' },
      { first: '', second: 'jumps' },
      { first: 'zxcv', second: 'over the' },
      { first: '', second: 'lazy fox' },
    ]).reverse()
    .chunk(function (entry) { return entry.first !== ''; })
    .reverse().value(), [
      [ { first: '', second: 'is nearly like that' },
        { first: '', second: 'in the hat' },
        { first: '', second: 'the cat' }, 
        { first: 'qwerty', second: 'yoyo' }],
      [ { first: '', second: 'jumps' },
        { first: 'asdf', second: 'the brown dog' }],
      [ { first: '', second: 'lazy fox' },
        { first: 'zxcv', second: 'over the' }],
    ],
    'reverse|> chunk(function) |> reverse');
    
  t.deepEqual($($.range(5))
    .reverse()
    .map(x => x * 4)
    .zip($.range(0, 10, 2))
    .reverse().value(),
    [[0,8],[4, 6],[8,4],[12,2],[16,0]],
    'range |> reverse |> map |> zip(range) |> reverse');
    
  t.deepEqual($($.range(10))
    .reverse()
    .map(x => x * 2)
    .chunk(2)
    .zip($.range(0, 10, 2))
    .reverse().value(),
    [[[2,0],8],[[6,4], 6],[[10,8],4],[[14,12],2],[[18,16],0]],
    'range |> reverse |> map |> chunk |> zip(range) |> reverse');
  t.end();
});

tape('Lazy Tests, Questionably useful', function (t) {
  var lazyTest1 = [];
  t.deepEqual($($.range(0, 6))
    .map(x => { lazyTest1.push(x); return x * 2; })
    .filter(x => { lazyTest1.push(x); return x % 3 !== 0; } )
    .map(x => { lazyTest1.push(x); return x * 2; })
    .value(),
    [4,8,16,20], 'Lazy1: evaluation');
  t.deepEqual(lazyTest1,
    [0,0,1,2,2,2,4,4,3,6,4,8,8,5,10,10],
    'Lazy1: map |> filter |> map');

  var lazyTest2 = [];
  t.deepEqual($($.range(2, -4, -1))
    .map(x => { x *= 2; lazyTest2.push(x); return x; })
    .map(x => { x /= 4; lazyTest2.push(x); return x; })
    .map(x => { x *= 3; lazyTest2.push(x); return x; })
    .value(),
    [3,1.5,0,-1.5,-3,-4.5],'Lazy2: evaluation');
  t.deepEqual(lazyTest2,
    [4,1,3,2,0.5,1.5,0,0,0,-2,-0.5,-1.5,-4,-1,-3,-6,-1.5,-4.5],
    'Lazy2: map |> map |> map');

  var lazyTest3 = [];
  t.deepEqual($($.range(0, -100, -5))
    .map(x => { x *= 2; lazyTest3.push(x); return x; })
    .map(x => { x /= 4; lazyTest3.push(x); return x; })
    .map(x => { x *= 3; lazyTest3.push(x); return x; })
    .take(4).value(),
    [0,-7.5,-15,-22.5],'Lazy3: evaluation');
  t.deepEqual(lazyTest3,
    [0,0,0,-10,-2.5,-7.5,-20,-5,-15,-30,-7.5,-22.5],
    'Lazy3: map |> map |> map |> take');

  var lazyTest4 = [];
  t.deepEqual($($.range(0, -10, -1))
    .filter(x => { lazyTest4.push(x); return x % 2 == 0; })
    .reduce((a, x) => { lazyTest4.push(x); a.push(x); return a; },[])
    .flatten(1)
    .map(x => { x *= 2; lazyTest4.push(x); return x; })
    .take(4).value(),
    [0, -4, -8, -12], 'Lazy4: evaluation');
  t.deepEquals(lazyTest4,
    [0,0,-1,-2,-2,-3,-4,-4,-5,-6,-6,-7,-8,-8,-9,0,-4,-8,-12],
    'Lazy4: filter |> reduce |> flatten |> take');

  var lazyTest5 = [];
  t.deepEqual($($.range(-5, -20, -1))
    .map(x => { x *= 2; lazyTest5.push(x); return x; })
    .chunk(2)
    .map(x => { lazyTest5.push(x); return x; })
    .flatten(1)
    .map(x => { x /= 2; lazyTest5.push(x); return x; })
    .take(4).value(),
    [-5, -6, -7, -8], 'Lazy5: evaluation');
  t.deepEquals(lazyTest5,
    [-10,-12,[-10, -12],-5,-6,-14,-16,[-14,-16],-7,-8],
    'Lazy5: map |> chunk |> map |> flatten |> map |> take');

  var lazyTest6 = [];
  t.deepEqual($($.range(10))
    .map(x => { x *= 2; lazyTest5.push(x); return x; })
    .reverse().take(6) // 18,16,14,12,10,8
    .reduce((a, x) => { lazyTest6.push(x); a.push(x); return a; },[])
    .flatten(1)
    .map(x => { x *= 2; lazyTest6.push(x); return x; })
    .reverse().take(4).value(),
    [16,20,24,28], 'Lazy6: evaluation');
  t.deepEquals(lazyTest6,
    [18,16,14,12,10,8,16,20,24,28],
    'Lazy6: range |> map |> take |> reduce |> flatten |> take');

  t.end();
});

tape('Non-Array Test', function (t) {
  t.equal(5,5,'');
  t.end();
});
//*/