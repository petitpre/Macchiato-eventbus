/**
 * This libraries allow to run qunit-like tests in a vert.x environment
 */
(function() {

  var module = function(name) {

  };

  var tests = [];
  var currentTest;

  var test = function(name, tested) {
    tests.push({name: name, tested: tested});
// runTest();
  };
  
  var asyncTest = function(name, tested) {
    tests.push({name: name, tested: tested});
  }

  var ok = function(txt) {
    console.log('[' + tests[currentTest].name + '] OK : ' + txt);

    if (tests[currentTest].expected) {
      tests[currentTest].expected--;      
    }
    
    if (!tests[currentTest].expected || tests[currentTest].expected<0)
      run();
  };

  var equal = function(ref, tested, message) {
    if (ref == tested) {
      ok(message);
    } else {
      console.log('[' +  tests[currentTest].name + '] ERROR : ' + txt + " "+ref +"!=" + tested);
    }
  };

  var start = function(){}
  
  var expect = function(number) {
    tests[currentTest].expected = number;
  };

  var run = function() {
    if (currentTest === undefined) {
      currentTest = 0;
    } else {
      currentTest++;
      while (currentTest >= tests.length)
        return;
    }
    console.log('[' + tests[currentTest].name + '] Start test');
    tests[currentTest].tested();
  };
    

  this.module = module;
  this.test = test;
  this.asyncTest = asyncTest;
  this.ok = ok;
  this.equal = equal;
  this.expect = expect;
  this.start = start;
  
  this.run = run;
  
}());


