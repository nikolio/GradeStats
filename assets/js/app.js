var XLSX = require("xlsx")
const hasha = require('hasha')
const path = require('path')
var Datastore = require('nedb')
var Plotly = require('plotly.js/dist/plotly-with-meta.js')
var base64 = require('base-64')
var utf8 = require('utf8')
var gradeStats = angular.module('GradeStats', ['ngMaterial', 'ngFileUpload', 'ui.router']);
// setting the different states for the application
gradeStats.config(function($stateProvider, $urlRouterProvider){
  setApplicationStates = function () {
    var importFileState = {
      name: 'import-file',
      url: '/import-file',
      templateUrl:'../html/partials/spreadSheetImport.html',
      controller: 'ImportController'
    }
    var aboutState = {
      name: 'about',
      url: '/about',
      templateUrl:'../html/partials/about.html',
      controller: 'AboutController'
    }
    var studentsState = {
      name: 'students',
      url: '/students',
      templateUrl:'../html/partials/studentInfo.html',
      controller: 'StudentInfoController'
    }
    var chartState = {
      name: 'charts',
      url: '/charts',
      templateUrl:'../html/partials/charts.html',
      controller: 'ChartController'
    }
    $stateProvider.state(importFileState);
    $stateProvider.state(aboutState);
    $stateProvider.state(studentsState);
    $stateProvider.state(chartState);
    $urlRouterProvider.otherwise('/import-file');
  }
  initializeDatabases = function() {
    dbEncode = function (doc) {
      var bytes = utf8.encode(doc)
      return base64.encode(bytes)
    }
    dbDecode = function (doc) {
      var bytes = utf8.decode(doc)
      return base64.decode(bytes)
    }
    var gradeStats = {
      filename: `${__dirname}/../../db/gradeStats.db`,
      autoload: true,
      afterSerialization: doc => dbEncode(doc),
      beforeDeserialization: doc => dbDecode(doc)
    }
    var importedFiles = {
      filename: `${__dirname}/../../db/importedFiles.db`,
      autoload: true,
      afterSerialization: doc => dbEncode(doc),
      beforeDeserialization: doc => dbDecode(doc)
    }
    db = new Datastore(gradeStats);
    importedFilesDb = new Datastore(importedFiles);
  }
  setApplicationStates()
  initializeDatabases()
});
dbInsert = function (db, document) {
  console.log('inserting document');
  db.insert(document, function (err, newDoc) {   // Callback is optional
    // newDoc is the newly inserted document, including its _id
    // newDoc has no key called notToBeSaved since its value was undefined
    if(err!=null) console.log(err);
  });
}
dbSaveImportedSpreadSheetDocument = function (db, document) {
  dbInsert(db, document);
}
dbSaveImportedFileInfo = function (db, document) {
  dbInsert(db, document);
}
parseSpreadSheet = function(filePath) {
  var workbook = XLSX.readFile(filePath);
  return workbook;
}
calculateFileSum = function (filePath) {
  return hasha.fromFile(filePath, {algorithm: 'sha512'});
}
dbSaveSpreadSheet = function(filePath, spreadSheet) {
  calculateFileSum(filePath).then(hash => {
    var importedFile = { _id: hash
                 , filename: path.basename(filePath)
                 , importTime: new Date()
              };
    var studentData = { _id: hash
                        , studentData: JSON.parse(spreadSheet)
                      };
      dbSaveImportedSpreadSheetDocument(db, studentData)
      dbSaveImportedFileInfo(importedFilesDb, importedFile)
  });
}
importSpreadSheet = function (filePath) {
  // parse spreadsheet file
  workbook = parseSpreadSheet(filePath)
  // convert workbook to json
  json = spreadSheetToJson(workbook)
  // save file to db
  dbSaveSpreadSheet(filePath, json)
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
    //\uff0E
    json = JSON.parse(JSON.stringify(data).split('.').join(''));
    json=JSON.stringify(json);
  });
  return json;
}
gradeStats.controller('AboutController', ['$scope', function($scope) {
  $scope.chrome=process.versions.chrome;
  $scope.electron=process.versions.electron;
  $scope.node= process.versions.node;
}]);
gradeStats.controller('ChartController', ['$scope', function($scope) {
    var studentCourseStatsData = [
      {
        x: [2007, 2008, 2009],
        y: [6, 10, 2],
        error_y: {
          type: 'data',
          array: [1, 2, 3],
          visible: true
        },
        type: 'scatter'
      }
    ];
    var studentCourseStatsLayout = {
      title: 'Course statistics graph',
      yaxis: {title: 'Average grade of all student in the course'},
      xaxis: {title: 'Exam period',
              type: 'category'
              }
    };
    var modeBarButtonOptions = {
      modeBarButtonsToRemove: [ 'sendDataToCloud'],
      displaylogo: false
    };
    Plotly.newPlot('studentCourseStats', studentCourseStatsData, studentCourseStatsLayout, modeBarButtonOptions);

    // y axis 0.40 is like 40 %
    var examStatsData = [
      {
        type: 'bar',
        x: [1, 2, 3, 5.5, 10],
        y: [0.40, 0.15, 0.05, 0.31, 0.04]
      }
    ];
    var examStatsLayout = {
      title: 'Exam period Jan 2017',
      yaxis: {
              title: 'Students percentage',
              tickformat: ',.0%',
              range: [0,1]
            },
      xaxis: {title: 'Grades'}
    };
    Plotly.plot('examStats', examStatsData, examStatsLayout, modeBarButtonOptions);

    var studentsSuccessStatsData = [
      {
        type: 'bar',
        x: [1, 2, 3, 5, 10],
        y: [0.40, 0.15, 0.05, 0.31, 0.04]
      }
    ];
    var studentsSuccessStatsLayout = {
      title: 'Students success in a course',
      yaxis: {
              title: 'Students percentage',
              tickformat: ',.0%',
              range: [0,1]
            },
      xaxis: {title: 'Success after exam period'}
    };
    Plotly.plot('studentsSuccessStats', studentsSuccessStatsData, studentsSuccessStatsLayout, modeBarButtonOptions);

}]);
gradeStats.controller('StudentInfoController', ['$scope', function($scope) {
  $scope.accordianData = [
        {
            "heading" : "Analog Electronics",
            "content" : "June 2007: 2, Sept 2007: 9"
        },
        {
            "heading" : "Digital Electronics",
            "content" : " June 2009: 4, July 2009: 8"
        }
     ];

} ]);
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
    var data="file";
    var encoded = base64.encode(data)
    var decoded = base64.decode(encoded)
    if (files && files.length) {
      console.log(decoded)

      console.log(files[0].path);
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.$error) importSpreadSheet(files[i].path);
      }
    }
  };

}]);
// Adds the hash as a primary db key for the document (student data)
/*
addHashToDocument = function (document, id) {
  d=JSON.parse(document)
  d.push("_id", id)
  d.unshift('_id', id)
  d.pop()
  d.pop()
  console.log('id',id)
  return d;
}
*/
