const DOM_Case = {
    load: function() {
        DOM_Case.case.load();
        DOM_Case.ed.load();
        DOM_Case.assess.load();
        DOM_Case.radiology.load();
    },
    case: {
        load: function() {
            DOM_Case.case.btns = $(".js-case-button");
            DOM_Case.case.main = $("#js-case-main");

            DOM_Case.case.overlay = $("#js-case-overlay");
            DOM_Case.case.timer = $("#js-case-timer");

            DOM_Case.case.inputs = ".case-input";
            DOM_Case.case.submits = ".case-submit";

            DOM_Case.case.patient = $("#js-patient");
            DOM_Case.case.name = $("#js-patient-name");
            DOM_Case.case.age_gender = $("#js-patient-age_gender");
            DOM_Case.case.status = $("#js-patient-status");
            DOM_Case.case.time = $("#js-patient-time");
            DOM_Case.case.well = $("#js-patient-well");
        }
    },
    ed: {
        load: function() {
            DOM_Case.ed.loc = "#js-ed-loc";
            DOM_Case.ed.complete = "ed_complete";
        }
    },
    assess: {
        load: function() {
            DOM_Case.assess.btns = ".js-assess-button";
            DOM_Case.assess.section = "#js-assess-section";
            DOM_Case.assess.mass = "#js-assess-mass";
            DOM_Case.assess.vitals = "#js-assess-vitals";
            DOM_Case.assess.race = "#js-assess-race";
            DOM_Case.assess.race_score = "#js-assess-race-score";
            DOM_Case.assess.cannula = "#js-assess-cannula";
            DOM_Case.assess.nihss = "#js-assess-nihss";
            DOM_Case.assess.nihss_score = "#js-assess-nihss-score";
            DOM_Case.assess.mrs = "#js-assess-mrs";
            DOM_Case.assess.mrs_score = "#js-assess-mrs-score";
            DOM_Case.assess.submit = "#js-assess-submit";
        }
    },
    radiology: {
        load: function() {
            DOM_Case.radiology.progress = "#js-radiology-progress"
        }
    }
};

const Case = {
    case_id: null,
    section: "",
    load: function() {
        Case.case_id = new URL(window.location.href).searchParams.get("case_id");

        if (!Case.case_id) {
            window.location.href = "/index.html";
        } else {
            API.get("cases", Case.case_id, Case.fillPatient);
        }

        Case.loadPageLoader();
        Case.loadSubmit();
    },
    loadSubmit: function() {
        $("body").on("click", DOM_Case.case.submits, function() {
            Case.overlay.showTimer();

            let data = {};
            data.case_id = Case.case_id;

            $(DOM_Case.case.inputs).each(function() {
                Case.getInput($(this), data);
            });

            API.put(Case.section, Case.case_id, data, function(result) {
                console.log(result);

                API.get(Case.section, Case.case_id, function(info) {
                    Case.fillPage(info);
                    if (Case.section == "cases") {
                        Case.fillPatient(info);
                    }
                });
            });
        });

    },
    fillPatient: function(patient) {
        console.log(patient);

        if (!patient) {
            window.location.href = "/index.html";
        }

        DOM_Case.case.name.text(API.data.getName(patient));
        DOM_Case.case.age_gender.text(API.data.getAgeGender(patient));
        DOM_Case.case.well.text(API.data.getLastWell(patient));
        DOM_Case.case.time.text(API.data.getStatusTime(patient));

        DOM_Case.case.patient.removeClass("incoming active completed");
        switch (patient.status) {
            case "incoming":
                DOM_Case.case.patient.addClass("incoming");
                DOM_Case.case.status.text("Incoming");
                break;
            case "active":
                DOM_Case.case.patient.addClass("active");
                DOM_Case.case.status.text("Active");
                break;
            case "completed":
                DOM_Case.case.patient.addClass("completed");
                DOM_Case.case.status.text("Completed");
                break;
        }
    },
    fillPage: function(data) {
        DOM_Case.case["main"].html("");

        DOM_Case.case["main"].load(`${Case.section}.html`, function() {
            //Make UI inputs work
            $(document).trigger("case:refresh");

            $.each(data, function(key, value) {
                Case.setInput(key, value);
            });

            Case.overlay.hideTimer();
        });

    },
    loadPageLoader: function() {
        DOM_Case.case["btns"].click(function() {
            if ($(this).hasClass("selected")) {
                return;
            }

            Case.overlay.showTimer();

            let section = $(this).data("section");
            let button = $(this);

            API.get(section, Case.case_id, function(data) {
                Case.section = section;

                Case.fillPage(data);

                //Change the selected button
                button.siblings(".js-case-button").removeClass("selected");
                button.addClass("selected");
            });
        });

        $("div[data-section='case_eds']").trigger("click");
    },
    setInput: function(name, value) {
        let input = $("#db-" + name);

        if (Case.section == "case_eds") {
            if (name == "location") {
                $(DOM_Case.ed.loc).children("span").text(value);
            } else {
                if (value == 1) {
                    input.closest("div").addClass(DOM_Case.ed.complete);
                }
            }
            return;
        }

        if (input.hasClass("-ui-since") || input.hasClass("-ui-toggle") || input.hasClass("-ui-select")) {
            input.trigger("ui:set", value);

            return;
        }

        if (input.prop("type") == "date") {
            let date = new Date(value);
            let currentDate = date.toISOString().slice(0,10);
            input.val(currentDate);
            input.removeClass("empty");

            return;
        }

        input.val(value);

    },
    getInput: function(element, data) {
        let key = element.attr("id").slice(3);

        if (Case.section == "case_eds" && element.is("[type='checkbox']")) {
            if (element.is(":checked")) {
                data[key] = 1;
            } else {
                data[key] = 0;
            }
            return;
        }

        if (element.hasClass("-ui-since") || element.hasClass("-ui-toggle") || element.hasClass("-ui-select")) {
            let obj = {val: null};
            element.trigger("ui:get", obj);
            data[key] = obj.val;
            return;
        }

        if (element.prop("type") == "date") {
            data[key] = new Date(element.val()).toISOString().substring(0, 10);

            return;
        }

        data[key] = element.val();
    },
    overlay: {
        showTimer() {
            DOM_Case.case.overlay.removeClass("hidden");
            DOM_Case.case.timer.removeClass("hidden");
        },
        hideTimer() {
            DOM_Case.case.overlay.addClass("hidden");
            DOM_Case.case.timer.addClass("hidden");
        }
    }
};

const Assess = {
    load: function() {
        $("body").on("click", DOM_Case.assess["btns"], function() {
            let loc = $(this).data("anchor");
            let val = $(DOM_Case.assess[loc]).offset().top - $(DOM_Case.assess["section"]).offset().top + $(DOM_Case.assess["section"]).scrollTop();

            $(DOM_Case.assess["section"]).animate({
                scrollTop: val
            }, {
                duration: 500,
                easing: "swing"
            })

        });

        //Load score calculations
        $("body").on("ui:select", DOM_Case.assess["section"] + " .-ui-select", function() {
            Assess.calcScore("race", "race_score");
            Assess.calcScore("nihss", "nihss_score");
            Assess.calcScore("mrs", "mrs_score");
        });
    },
    calcScore: function(container_name, score_name) {
        let score = 0;
        $(DOM_Case.assess[container_name]).find("input").each(function(){
            //Don't add Toggle inputs
            if (!$(this).parent().hasClass("-ui-select")) {
                return;
            }

            score += parseInt($(this).val());

        });

        //Print out
        if (score) {
            $(DOM_Case.assess[score_name]).text(score);
            $(DOM_Case.assess[score_name]).removeClass("empty");
        } else {
            $(DOM_Case.assess[score_name]).text("??");
            $(DOM_Case.assess[score_name]).addClass("empty");
        }
    }
};

const Radiology = {
    load: function() {
        //Go down the progress pathway
        //TODO: Do this smarter?
        $("body").on("ui:toggle", DOM_Case.radiology["progress"] + " .-ui-toggle", function() {
            let progress = 0;

            while (true) {
                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-0", "1")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-1", "1")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-2", "0")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-3", "1")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-4", "1")) {
                    progress++;
                } else {
                    break;
                }

                break;
            }

            for (let i = 0; i < 6; i++) {
                if (i <= progress) {
                    $(DOM_Case.radiology["progress"] + "-" + i).removeClass("hidden");
                } else {
                    $(DOM_Case.radiology["progress"] + "-" + i).addClass("hidden");
                    $(DOM_Case.radiology["progress"] + "-" + i).find(".-ui-toggle").trigger("ui:clear");
                }
            }
        });

        //Ensure the proper progress is loaded when the page is loaded
        $(document).on("case:refresh", function() {
            $(DOM_Case.radiology["progress"] + "-0").trigger("ui:toggle");
        });
    },
    checkProgress: function(id, wanted) {
        let input = $(id).find("input");
        if (input.val() == wanted) {
            return true;
        } else {
            return false;
        }
    }
};


/************
 * ON READY *
 ************/

$(document).ready(function() {
    DOM_Case.load();

    Case.load();

    Assess.load();
    Radiology.load();

});

/*******************
 *  MISC FUNCTIONS *
 *******************/
