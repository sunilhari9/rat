var app = angular.module("report",[]);

app.directive("datepicker", function () {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, elem, attrs, ngModelCtrl) {
            var updateModel = function (dateText) {
                scope.$apply(function () {
                    ngModelCtrl.$setViewValue(dateText);
                });
            };
            var options = {
                dateFormat: "yy-mm-dd",
                onSelect: function (dateText) {
                    updateModel(dateText);
                }
            };
            elem.datepicker(options);
        }
    }
});
app.controller("workEfforts", function($scope, $http) {

    $scope.UniqueDates = [];
    $scope.WESortedList = [];
    $scope.reportData = {};
    $scope.endDate = "";
    $scope.startDate = {};
    $scope.showTable = false;

    $scope.updateList = function() {
        $("#busy").show();
        //var historyUrl= "data/we.json";
        var historyUrl= "http://pslimsapp/slims/api/services/riskscoring/history?from="+$scope.endDate;
        var dateAr = $scope.endDate.split('-');
        var WeDateFormated = dateAr[1] + '/' + dateAr[2] + '/' + dateAr[0];
        $http.get(historyUrl)
            .then(function(response) {

            $scope.weList = response.data;
            $scope.WESortedList = [];
            $.each($scope.weList, function(i, v) {
                if (WeDateFormated === v.LoadDate) {
                    $scope.WESortedList.push(v)
                }
            });
            if($scope.WESortedList.length == 0){
                $scope.errorMessage="No Work Efforts Logged"   
            }else{
                $scope.errorMessage="";
                $scope.WESortedList.unshift({
                    "RecordID": "All"
                });
            }
            $("#busy").hide();
        }, function(e) {
            $("#busy").hide();
             $scope.errorMessage="Failed to Load WE Data from the service";
        });

    }

    $scope.generateReport = function() {
        var data = {};
        var reportData = [];
        var HiggestQAHr = 0;
        var HiggestNonQAHr = 0;
        var indexOfHiggestHr = [];
        if ($scope.weRecord.RecordID == "All") {
            $.each($scope.WESortedList, function(weIndex, we) {

                $.each($scope.weList, function(i, v) {
                    if (we.RecordID == v.RecordID)
                        if (v.report != undefined)
                            reportData.push(generateHrs(v.report, v.RecordID));

                });
            });
        } else {
            var reportData = [];
            $.each($scope.weList, function(i, v) {
                if ($scope.weRecord.RecordID === v.RecordID) {
                    $scope.reportData.weReportData = v;
                }
            });
            if ($scope.reportData.weReportData.report != undefined)
                reportData.push(generateHrs($scope.reportData.weReportData.report, $scope.weRecord.RecordID));
        }
        if ($scope.weRecord.RecordID == "All") {
            $.each(reportData, function(i, we) {
                var QAHr = parseInt(we.Actual_Test_Queue.substring(0, we.Actual_Test_Queue.indexOf("hr")));
                var NonQAHr = parseInt(we.Actual_Dev_Queue.substring(0, we.Actual_Dev_Queue.indexOf("hr"))) + parseInt(we.Actual_SCM_Queue.substring(0, we.Actual_SCM_Queue.indexOf("hr")));
                if (parseInt(HiggestQAHr) <= parseInt(QAHr)) {
                    HiggestQAHr = QAHr;
                }
                if (parseInt(HiggestNonQAHr) <= parseInt(NonQAHr)) {
                    HiggestNonQAHr = NonQAHr;
                }

            });

            $.each(reportData, function(i, we) {
                var QaHr = parseInt(we.Actual_Test_Queue.substring(0, we.Actual_Test_Queue.indexOf("hr")));
                var NonQAHr = parseInt(we.Actual_Dev_Queue.substring(0, we.Actual_Dev_Queue.indexOf("hr"))) + parseInt(we.Actual_SCM_Queue.substring(0, we.Actual_SCM_Queue.indexOf("hr")));
                if (HiggestQAHr == QaHr)
                    reportData[i].Highest_QA_Hrs = HiggestQAHr;
                else
                    reportData[i].Highest_QA_Hrs = "";
                if (HiggestNonQAHr == NonQAHr)
                    reportData[i].Highest_NonQA_Hrs = HiggestNonQAHr;
                else
                    reportData[i].Highest_NonQA_Hrs = "";
            });
        }
        /*else{
                  reportData[0].Highest_NonQA_Hrs=""; 
                  reportData[0].Highest_QA_Hrs=""; 
                }*/
        $scope.reportData = reportData;
        $scope.showTable = true;
        //JSONToCSVConvertor(reportData,"Report_"+new Date(),true);
    }
    $scope.saveAsCsv = function() {
        JSONToCSVConvertor(angular.toJson($scope.reportData), "Report_" + new Date(), true);
    }

});

app.filter('unique', function() {

    return function(items, filterOn) {

        if (filterOn === false) {
            return items;
        }

        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
            var hashCheck = {},
                newItems = [];

            var extractValueToCompare = function(item) {
                if (angular.isObject(item) && angular.isString(filterOn)) {
                    return item[filterOn];
                } else {
                    return item;
                }
            };

            angular.forEach(items, function(item) {
                var valueToCheck, isDuplicate = false;

                for (var i = 0; i < newItems.length; i++) {
                    if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    newItems.push(item);
                }

            });
            items = newItems;
        }
        return items;
    };
});

function showDiff(d1, d2) {
    var date1 = new Date(d1);
    var date2 = new Date(d2);
    var oneDay = 24 * 60 * 60 * 1000;
    //Customise date2 for your required future time

    var diff = (date2 - date1) / 1000;
    var diff = Math.abs(Math.floor(diff));

    var days = Math.floor(diff / (24 * 60 * 60));
    var leftSec = diff - days * 24 * 60 * 60;

    var hrs = Math.floor(diff / (60 * 60));
    var leftSec = leftSec - Math.floor(leftSec / (60 * 60)) * 60 * 60;

    var min = Math.floor(leftSec / (60));
    var leftSec = leftSec - min * 60;

    return {
        hrs: hrs,
        min: min
    };

}

function msieversion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return true
    {
        return true;
    } else { // If another browser,
        return false;
    }
    return false;
}

function JSONToCSVConvertor(JSONData, fileName, ShowLabel) {
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    var CSV = '';
    if (ShowLabel) {
        var row = "";
        for (var index in arrData[0]) {
            row += index + ',';
        }
        row = row.slice(0, -1);
        CSV += row + '\r\n';
    }
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        for (var index in arrData[i]) {
            var arrValue = arrData[i][index] == null ? "" : '="' + arrData[i][index] + '"';
            row += arrValue + ',';
        }
        row.slice(0, row.length - 1);
        CSV += row + '\r\n';
    }
    if (CSV == '') {
        growl.error("Invalid data");
        return;
    }
    if (msieversion()) {
        var IEwindow = window.open();
        IEwindow.document.write('sep=,\r\n' + CSV);
        IEwindow.document.close();
        IEwindow.document.execCommand('SaveAs', true, fileName + ".csv");
        IEwindow.close();
    } else {
        var uri = 'data:application/csv;charset=utf-8,' + escape(CSV);
        var link = document.createElement("a");
        link.href = uri;
        link.style = "visibility:hidden";
        link.download = fileName + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function generateHrs(csvData, forWEID) {
    var totalRegHr = 672;
    var totalFunHr = 160;
    var reportData = angular.copy(csvData);
    var totalDevHrs = 0,
        totalDevMin = 0,
        totalTestHr = 0,
        totalTestMin = 0,
        totalHrs = 0,
        totalMin = 0,
        totalScmHrs = 0,
        totalScmMin = 0,
        actualTestMin = 0,
        actualDevMin = 0,
        actualScmMin = 0,
        actualTestHrs = 0,
        actualDevHrs = 0,
        actualScmHrs = 0;
    var devQueueStart = [];
    var devQueueEnd = [];
    var scmStart = [];
    var scmEnd = [];
    var devReadyState = false;
    var scmReadyState = false;
    var StartReadingTime = false;
    var report = {};

    $.each(reportData, function(index, value) {
        var str = value.Comment;
        switch (str) {
            case (str.match(/QA Ready/) || {}).input:
                if(scmReadyState){
                    scmEnd.push(value.Date)
                    scmReadyState = false;
                }
                StartReadingTime = true;
                break;
            case (str.match(/SCM Build Ready/) || {}).input:
                if (StartReadingTime) {
                    if (!scmReadyState) {
                        scmStart.push(value.Date);
                        scmReadyState = true;
                    }
                    if (devReadyState) {
                        devQueueEnd.push(value.Date)
                        devReadyState = false;
                    }
                }
                break;
            case (str.match(/DEV Working/) || {}).input:
                if (StartReadingTime) {
                    if (!devReadyState) {
                        devQueueStart.push(value.Date)
                        devReadyState = true;
                    }
                    if(scmReadyState){
                        scmEnd.push(value.Date)
                        scmReadyState = false;
                    }

                }
                break;

            case (str.match(/SCM Build Complete/) || {}).input:
                if (StartReadingTime) {
                    if(scmReadyState){
                        scmEnd.push(value.Date)
                        scmReadyState = false;
                    }
                }
                break;
            case (str.match(/Cancelled/) || {}).input:
                if (StartReadingTime) {
                    if (devReadyState) {
                        devQueueEnd.push(value.Date)
                        devReadyState = false;
                    }
                }

                break;
            case (str.match(/SCM Loadset Ready/) || {}).input:
                if (StartReadingTime) {
                    if(scmReadyState){
                        scmEnd.push(value.Date)
                        scmReadyState = false;
                    }
                }
                break;

        }

    });
    if (scmReadyState) {
        scmEnd.push(new Date());
        scmReadyState = false;
    }
    if (devReadyState) {
        devQueueEnd.push(new Date());
        devReadyState = false;
    }

    $.each(devQueueStart, function(index, value) {
        var differnce = showDiff(devQueueStart[index], devQueueEnd[index]);
        totalDevHrs += differnce.hrs;
        totalDevMin += differnce.min;
    })
    $.each(scmStart, function(index, value) {
        var differnce = showDiff(scmStart[index], scmEnd[index]);
        totalScmHrs += differnce.hrs;
        totalScmMin += differnce.min;
    })


    if (totalDevMin >= 60) {
        totalDevHrs = totalDevHrs + Math.floor(totalDevMin / 60);
        totalDevMin = totalDevMin % 60;
    }


    if (totalScmMin >= 60) {
        totalScmHrs = totalScmHrs + Math.floor(totalScmMin / 60);
        totalScmMin = totalScmMin % 60;
    }

    if (Math.round(totalDevHrs / 24 * 8) < 8) {
        actualDevMin = totalDevMin;
        actualDevHrs = totalDevHrs;
    } else {
        actualDevHrs = Math.round(totalDevHrs / 24 * 8);
    }
    if (Math.round(totalScmHrs / 24 * 8) < 8) {
        actualScmMin = totalScmMin;
        actualScmHrs = totalScmHrs;
    } else {
        actualScmHrs = Math.round(totalScmHrs / 24 * 8);
    }
    //QA Func_hrs = Total hrs – Non QA Hrs (Dev+SCM)
    var totalTestHr = totalRegHr - (totalDevHrs + totalScmHrs);
    var actualTestHrs = totalFunHr - (actualDevHrs + actualScmHrs);

    totalTestMin = totalDevMin + totalScmMin;
    if (totalTestMin >= 60) {
        totalTestHr = totalTestHr - Math.floor(totalTestMin / 60);
        totalTestMin = 60 - totalTestMin % 60;
    } else {
        if (totalTestMin > 0)
            totalTestMin = 60 - totalTestMin;
    }

    actualTestMin = actualDevMin + actualScmMin;
    if (actualTestMin >= 60) {
        actualTestHrs = actualTestHrs - Math.floor(actualTestMin / 60);
        actualTestMin = 60 - actualTestMin % 60;
    } else {
        if (actualTestMin > 0)
            actualTestMin = 60 - actualTestMin;
    }


    if (totalRegHr == totalTestHr) {
        totalTestMin = 0;
    }
    if (totalFunHr == actualTestHrs) {
        actualTestMin = 0;
    }
    if (actualTestHrs < 20)
        report.timeStamp = 8;
    if (actualTestHrs > 20 && actualTestHrs < 40)
        report.timeStamp = 7;
    if (actualTestHrs > 40 && actualTestHrs < 60)
        report.timeStamp = 6;
    if (actualTestHrs > 60 && actualTestHrs < 80)
        report.timeStamp = 5;
    if (actualTestHrs > 80 && actualTestHrs < 100)
        report.timeStamp = 4;  
    if (actualTestHrs > 100 && actualTestHrs < 120)
        report.timeStamp = 3;  
    if (actualTestHrs > 120 && actualTestHrs < 140)
        report.timeStamp = 2;
    if (actualTestHrs > 140)
        report.timeStamp = 1;
    report.RecordID = forWEID;
    report.Actual_Test_Queue = actualTestHrs + "hr : " + actualTestMin + "min";
    report.Actual_Dev_Queue = actualDevHrs + "hr : " + actualDevMin + "min";
    report.Actual_SCM_Queue = actualScmHrs + "hr : " + actualScmMin + "min";

    report.Total_QA_Hours = totalTestHr + "hr : " + totalTestMin + "min";
    report.Total_Dev_Hours = totalDevHrs + "hr : " + totalDevMin + "min";
    report.Total_SCM_Hours = totalScmHrs + "hr : " + totalScmMin + "min";
    return report;
}