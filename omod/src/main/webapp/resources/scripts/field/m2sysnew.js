/*API Call*/
function capture(deviceName, templateFormat, engineName, useTemplate,sourceButton) {
    var apiPath = 'http://localhost:15896/api/CloudScanr/FPCapture';
    toggleFingerprintButtonDisplay(sourceButton);
    if (useTemplate === "yes") {
        jq.getJSON('/' + OPENMRS_CONTEXT_PATH + '/registrationapp/field/fingerprintM2sys/loadTemplateTemplate.action')
            .success(function (response) {
                processTemplate(response.testTemplate);

            })
            .error(function (xhr, status, err) {
                console.log("Error Processing");
                alert('AJAX error ' + err);
            });
    } else {
        console.log("Using the scanner");
        CallFPBioMetricCapture(SuccessFunc, ErrorFunc, apiPath, deviceName, templateFormat, engineName);
    }
}

function biometricSearch(deviceName, templateFormat, engineName, useTemplate,sourceButton) {
    var apiPath = 'http://localhost:15896/api/CloudScanr/FPCapture';
    toggleFingerprintButtonDisplay(sourceButton);
    if (useTemplate === "yes") {
        jq.getJSON('/' + OPENMRS_CONTEXT_PATH + '/registrationapp/field/fingerprintM2sys/loadTemplateTemplate.action')
            .success(function (response) {
                searchPatientByBiometricXml(response.testTemplate,sourceButton);
            })
            .error(function (xhr, status, err) {
                toggleFingerprintButtonDisplay(sourceButton);
                alert('AJAX error ' + err);
            });
    } else {
        CallFPBioMetricCapture(SuccessFunc, ErrorFunc, apiPath, deviceName, templateFormat, engineName);
    }
}

function CallFPBioMetricCapture(SuccessFunc, ErrorFunc, apiPath, deviceName, templateFormat, engineName) {

    var uri = apiPath;

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            fpobject = JSON.parse(xmlhttp.responseText);
            SuccessFunc(fpobject, engineName);
        } else if (xmlhttp.status == 404) {
            ErrorFunc(xmlhttp.status)
        }
    }


    var captureType = 'DoubleCapture';
    var quickScan = 'Enable';
    var successMessage = document.getElementById('successMessage').value;
    var errorMessage = document.getElementById('errorMessage').value;
    var engineMessage = document.getElementById('engineMessage').value;

    xmlhttp.open("POST", uri, true);
    xmlhttp.setRequestHeader("Content-Type", "application/json");

    xmlhttp.setRequestHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    xmlhttp.send(JSON.stringify({
        "DeviceName": deviceName,
        "TemplateFormat": templateFormat,
        "CaptureType": captureType,
        "QuickScan": quickScan,
        "CaptureTimeOut": 120,
        "CaptureOperationName": "ENROLL"
    }));

    xmlhttp.onerror = function () {
        ErrorFunc(xmlhttp.statusText);
        toggleFingerprintButtonDisplay(jq('#captureButton'));
    }
}

function processTemplate(result) {

    document.getElementById('biometricXml').value = result;
    $('#fingerprintStatus').text("Template Loaded Successfully");

    var patient_id;
    var searchFinger;
    var element;

    element = document.getElementById('patient_id');
    if (element != null) {
        patient_id = element.value;
    } else {
        patient_id = '';
    }


    element = document.getElementById('searchFinger');
    console.log(element);
    if (element != null) {
        searchFinger = element.value;
    } else {
        searchFinger = '';
    }


    if (patient_id != '') {
        saveFinger();
    }

    if (searchFinger == '1') {
        searchPatient();
    }

}

function SuccessFunc(result, engineName) {
    if (result.CloudScanrStatus.Success) {

        if (result.TemplateData != null && result.TemplateData.length > 0) {
            document.getElementById('biometricXml').value = result.TemplateData;
        }
        //document.getElementById('<%= serverResult.ClientID %>').value = "Capture success. Please click on capture button";
        //$('#serverResult').val('Capture success. Please click on capture button');
        $('#fingerprintStatus').text(result.CloudScanrStatus.Message);

        var patient_id;
        var searchFinger;
        var element;

        element = document.getElementById('patient_id');
        if (element != null) {
            patient_id = element.value;
        } else {
            patient_id = '';
        }


        element = document.getElementById('searchFinger');
        console.log(element);
        if (element != null) {
            searchFinger = element.value;
        } else {
            searchFinger = '';
        }


        if (patient_id != '') {
            saveFinger();
        }

        if (searchFinger == '1') {
            searchPatient();
        }


    } else {
        //$('#serverResult').val(result.CloudScanrStatus.Message);
        $('#fingerprintStatus').text(result.CloudScanrStatus.Message);
        toggleFingerprintButtonDisplay(jq('#captureButton'));
    }
}

function ErrorFunc(status) {
//$('#serverResult').val('CloudScanr client may not started. Please check.');
    alert(engineMessage);
    toggleFingerprintButtonDisplay(jq('#captureButton'));
    //$('#fingerprintStatus').text(engineMessage);
}

function saveFinger() {
    var biometricXml = document.getElementById('biometricXml').value;
    var identifierValue = document.getElementById('identifierValue').value;
    var patient_id = document.getElementById('patient_id').value;
    var successMessage = document.getElementById('successMessage').value;
    var errorMessage = document.getElementById('errorMessage').value;
    if (identifierValue == '') identifierValue = 0;
    jq.getJSON('/' + OPENMRS_CONTEXT_PATH + '/registrationapp/field/fingerprintM2sys/update.action', {
        patientId: patient_id,
        biometricXml: biometricXml,
        identifierValue: identifierValue
    })
        .success(function (data) {
            $('#fingerprintStatus').text(successMessage);
        })
        .error(function (data) {
            $('#fingerprintError').text(errorMessage);
        });
}


function searchPatient() {
    var biometricXml = document.getElementById('biometricXml').value;
    jq.getJSON('/' + OPENMRS_CONTEXT_PATH + '/registrationapp/search/M2SysSearch/search.action', {biometricXml: biometricXml})
        .success(function (data) {
            if (data['success'] === true) {
                if (data['status'] === 'ALREADY_REGISTERED' && data['patientUuid']) {
                    m2SysShowAlreadyExistingFingerprintsDialog(data);
                } else {
                    m2SysSuccess();
                    m2SysSetSubjectIdInput(data['localBiometricSubjectId'], data['nationalBiometricSubjectId'])
                    toggleFingerprintButtonDisplay(jq('#captureButton'));
                }
            } else {
                m2SysErrorMessage(data['message']);
                m2SysClearSubjectIdInput();
            }
        })
        .error(function (data) {
            alert(errorMessage);
            $('#fingerprintError').text(errorMessage);
        });
}

function mpiImportingDialog(data,sourceButton) {
    var emrDialog = emr.setupConfirmationDialog({
        selector: '#patient-biometric-search-dialog',
        actions: {
            confirm: function () {
                emrDialog.close();
                redirectToPatient(data['patientUuid']);
            },
            cancel: function () {
                toggleFingerprintButtonDisplay(sourceButton);
            }
        }
    });
    emrDialog.show();
}

function searchPatientByBiometricXml(biometricXml,sourceButton) {
    jq.getJSON('/' + OPENMRS_CONTEXT_PATH + '/registrationapp/search/M2SysSearch/search.action', {biometricXml: biometricXml})
        .success(function (data) {
            if (data['success'] === true) {
                if (data['status'] === 'ALREADY_REGISTERED' && data['patientUuid']) {
                    mpiImportingDialog(data,sourceButton);
                } else {
                    toggleFingerprintButtonDisplay(sourceButton);
                    alert("No registered patient with given biometric data")
                }
            } else {
                console.log(data['message']);
            }
        })
        .error(function (data) {
            alert("Error while processing fingerprint details "+data['message']);
        });
}

function redirectToPatient(patientUuid) {
    emr.navigateTo({
        provider: 'coreapps',
        page: 'clinicianfacing/patient',
        query: {patientId: patientUuid}
    });
}

	