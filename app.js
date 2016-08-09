var gradeStats = angular.module('GradeStats', ['ngMaterial', 'ngFileUpload']);
var XLSX = require("xlsx")
var Datastore = require('nedb') , db = new Datastore({ filename: `${__dirname}/db/gradeStats.db`, autoload: true });
gradeStats.controller('MyCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {

  var sheet;
    $scope.$watch('files', function () {
        $scope.upload($scope.files);
    });
    $scope.$watch('file', function () {
        if ($scope.file != null) {
            $scope.files = [$scope.file];
        }
    });
    $scope.log = '';

    $scope.upload = function (files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
              var file = files[i];
              if (!file.$error) {
                Upload.upload({
                    url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
                    data: {
                      username: $scope.username,
                      file: file
                    }
                }).then(function (resp) {
                    $timeout(function() {
                        $scope.log = 'file: ' +
                        resp.config.data.file.name +
                        ', Response: ' + JSON.stringify(resp.data) +
                        '\n' + $scope.log;
                                        console.log(files[0].path);
                        var url = "ppp.xls";

var oReq = new XMLHttpRequest();
oReq.open("GET", files[0].path, true);
oReq.responseType = "arraybuffer";

oReq.onload = function(e) {
  var arraybuffer = oReq.response;
  var data = new Uint8Array(arraybuffer);
  var arr = new Array();
  for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
  var bstr = arr.join("");

  /* Call XLS */
  var workbook = XLSX.read(bstr, {type:"binary"});
  var sheet_name_list = workbook.SheetNames;
  sheet_name_list.forEach(function(y) { /* iterate through sheets */
  var worksheet = workbook.Sheets[y];
  $scope.sheet = worksheet;
  for (z in worksheet) {
  //  console.log(XLSX.utils.sheet_to_json(worksheet));
  /* all keys that do not begin with "!" correspond to cell addresses */
  if(z[0] === '!') continue;
  console.log(y + "!" + z + "=" + JSON.stringify(worksheet[z].v));

  }



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

     var  doc = data;
    sheet = data;
    json = JSON.parse(JSON.stringify(data).replace('.', '\uff0E'));
    doc = JSON.stringify(json);
       console.log(doc);
       sheet = doc;
//doc.replace('.', '\uff0E');
//  var  doc = [{"ΑΕΜ":"6866","Ονοματεπώνυμο":"PLAKA ENDRIT","Πατρώνυμο":"RAME ","Περιοδος-Εγγραφής":"2010-11 Χ","Εξαμηνο-Δηλωσης":"8 ","Κατάσταση":"Ενεργός","Σύνολο-Απουσιών":"0","Κατάσταση δήλωσης":"Κανονική ","Βαθμός":"0 "}];
  db.insert(doc, function (err, newDoc) {   // Callback is optional
  // newDoc is the newly inserted document, including its _id
  // newDoc has no key called notToBeSaved since its value was undefined
  console.log(err);
  console.log(newDoc);
});

    $scope.$apply(function() {
            $scope.json = sheet;
    });

//    console.log($scope.json);
});
//console.log(XLSX.utils.sheet_to_json(worksheet));

  });



}

oReq.send();
                //    $scope.log = $scope.log + JSON.stringify(files[0]);
                    });
                }, null, function (evt) {
                    var progressPercentage = parseInt(100.0 *
                    		evt.loaded / evt.total);
                    $scope.log = 'progress: ' + progressPercentage +
                    	'% ' ;
                  //  $scope.sheet= sheet;
                    $scope.json = "l";

                });
              }
            }
        }
    };
}]);
