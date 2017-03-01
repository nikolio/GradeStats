var XLSX = require("xlsx")
var Datastore = require('nedb') , db = new Datastore({ filename: `${__dirname}/db/gradeStats.db`, autoload: true });
var gradeStats = angular.module('GradeStats', ['ngMaterial', 'ngFileUpload']);
dbSaveImportedSpreadSheetDocument = function (document) {
  console.log('inserting document');
  db.insert(document, function (err, newDoc) {   // Callback is optional
    // newDoc is the newly inserted document, including its _id
    // newDoc has no key called notToBeSaved since its value was undefined
    console.log(err);
    //console.log(newDoc);
  });
}
parseSpreadSheet = function(filePath) {
  var workbook = XLSX.readFile(filePath);
  return workbook;
}
importSpreadSheet = function (filePath) {
  workbook = parseSpreadSheet(filePath);
  json = spreadSheetToJson(workbook);
  dbSaveImportedSpreadSheetDocument(json);
}
spreadSheetToJson = function (workbook) {
  var sheet_name_list = workbook.SheetNames;
  sheet_name_list.forEach(function(y) {
    var worksheet = workbook.Sheets[y];
    var headers = {};
    var data = [];
    for(z in worksheet) {
      if(z[0] === '!') continue;
      //parse out the column, row, and value
      var col = z.substring(0,1);
      var row = parseInt(z.substring(1));
      var value = worksheet[z].v;

      //store header names
      if(row == 1) {
        headers[col] = value;
        continue;
      }
      if(!data[row]) data[row]={};
      data[row][headers[col]] = value;
    }
    //drop those first two rows which are empty
    data.shift();
    data.shift();
    json = JSON.parse(JSON.stringify(data).replace('.', '\uff0E'));
    json=JSON.stringify(json);
  });
  return json;
}
gradeStats.controller('ImportController', ['$scope', function ($scope) {
  $scope.$watch('files', function () {
    $scope.import($scope.files);
  });
  $scope.$watch('file', function () {
    if ($scope.file != null) {
      $scope.files = [$scope.file];
    }
  });
  $scope.import = function (files) {
    if (files && files.length) {
      console.log(files[0].path);
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.$error) importSpreadSheet(files[i].path);
      }
    }
  };
}]);
