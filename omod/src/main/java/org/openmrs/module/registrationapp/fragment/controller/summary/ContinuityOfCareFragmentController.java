package org.openmrs.module.registrationapp.fragment.controller.summary;

import org.openmrs.Patient;
import org.openmrs.api.context.Context;
import org.openmrs.module.xdssender.api.domain.Ccd;
import org.openmrs.module.xdssender.api.service.CcdService;
import org.openmrs.ui.framework.annotation.FragmentParam;
import org.openmrs.ui.framework.fragment.FragmentModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.File;
import java.io.FileOutputStream;

public class ContinuityOfCareFragmentController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ContinuityOfCareFragmentController.class);

    public void controller(FragmentModel model, @FragmentParam("patientId") Integer patientId) {

        Patient patient = Context.getPatientService().getPatient(patientId);

        CcdService ccdService = Context.getRegisteredComponent("ccdService", CcdService.class);
        Ccd ccd = ccdService.getLocallyStoredCcd(patient);
        boolean isCCDAvailable = ccd != null;

        model.addAttribute("isCCDAvailable", isCCDAvailable);
        if (isCCDAvailable) {
            model.addAttribute("CCDDate", ccd.getDownloadDate().toString());
        }
    }

    public void viewCCD() {
        LOGGER.info("View CCD");
    }

    public void importCCD(@RequestParam("patientId") Integer patientId) {
        try {
            String filename = "/tmp/openmrs/registrationapp/ccd/patient" + patientId + "-ccd.pdf";
            FileOutputStream stream = new FileOutputStream(new File(filename), false);
            CcdService service = Context.getRegisteredComponent("ccdService", CcdService.class);
            service.downloadCcdAsPDF(stream, Context.getPatientService().getPatient(patientId));
        } catch (Exception ex) {
            LOGGER.error(ex.getMessage(), ex);
        }
    }
}