describe('LogsCtrl', function() {
  var scope = {};

  beforeEach(module('starter.controllers'));
/*
  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    rootScope = $rootScope.$new();
    $controller('LogsCtrl', {$rootScope: rootScope, $scope: scope} );
  } ));
*/
  it('should work', function() {
    expect(scope).toBeDefined();
  } );
} );
