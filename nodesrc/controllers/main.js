'use strict';

const requireFrom = require('requirefrom');
const bakar = require('winston');
const Q = require('q');
const fs = require('fs');
const controllers = requireFrom('nodesrc/controllers');
const nodesrc = requireFrom('nodesrc');
const models = nodesrc('models');
const userController = controllers('user').user;
const connPivot = 200;
const Clarifai = require('clarifai');
const Wreck = require('wreck');
const now = 128 * 40;
const Reqst = require('request');

const start = 128 * 39;

// initialize with your clientId and clientSecret

//God of Rockhead
const app = new Clarifai.App(
	constants.clarifai.secretKey,
	constants.clarifai.publicKey
);

app.getToken();


function MainController() {

}

MainController.prototype.fetchTags = function (request, reply) {
    bakar.debug('fetching tags...');
    var batch = 0;
    var batchSize = 100;
    var startBatch = 171;
    var loopCount = 50;
    var batchArr = [];
    var pChain = Q();
    for (var i = startBatch; i < startBatch + loopCount; i++) {
        batchArr.push(i);
    }
    bakar.debug('Batches', batchArr.length);
    batchArr.reduce(function (p, args) {
        return p.delay(3000).then(function (batch) {
            try {
                var cands;
                return models.UserProfile.find({ $and: [{ pictureUrl: { $exists: true } }, { pictureUrl: { $ne: null } }, { pictureUrl: { $ne: "" } }] }, { pictureUrl: 1, userId: 1, provider: 1 }).limit(batchSize).skip(batch * batchSize).exec().then(function (candidates) {
                    bakar.debug('Processing batch', batch);
                    bakar.debug(candidates.length);
                    cands = candidates;
                    let imgArr = [];
                    for (var idx in candidates) {
                        let candidate = candidates[idx];
                        imgArr.push(candidate.pictureUrl);
                    }
                    return getTagsv2(imgArr);
                }).then(function (imgResults) {
                    for (var i in imgResults.outputs) {
                        let imgInfo = imgResults.outputs[i];
                        //bakar.info(cands[i].pictureUrl);
                        //bakar.info(imgInfo.input.data.image.url);
                        try {

                            if (!imgInfo.input) {
                                bakar.info(imgInfo);
                            }
                            if (cands[i].pictureUrl === imgInfo.input.data.image.url) {
                                let tags = [];

                                for (var ptr in imgInfo.data.concepts) {
                                    let obj = imgInfo.data.concepts[ptr];
                                    tags.push({ name: obj.name, concepts_id: obj.id, score: obj.value });
                                }
                                let data = { userId: cands[i].userId, provider: cands[i].provider, url: cands[i].pictureUrl, tags: tags };
                                //bakar.info(data);
                                models.Pixie.update({ userId: data.userId }, data, { upsert: true }).catch(function (err) {
                                    bakar.error(err);
                                });

                            } else {
                                bakar.info('Urls do not match', cands[i].pictureUrl, imgInfo.input.data.image.url);
                            }
                        } catch (e) {
                            bakar.error(e);
                        }
                    }
                    /*for (var i in imgResults.results) {
                        let imgInfo = imgResults.results[i];
                        bakar.info(cands[i].pictureUrl);
                        bakar.info(cands[i].provider);
                        bakar.info(imgInfo.url);
                        if (cands[i].pictureUrl === imgInfo.url) {
                            let tags = [];
                            try {

                                for (var ptr in imgInfo.result.tag.classes) {
                                    tags.push({ name: imgInfo.result.tag.classes[ptr], concepts_id: imgInfo.result.tag.concept_ids[ptr], score: imgInfo.result.tag.probs[ptr] });
                                }
                                let data = { userId: cands[i].userId, provider: cands[i].provider, url: cands[i].pictureUrl, tags: tags };
                                //bakar.info(data);
                                models.Pixie.update({ userId: data.userId }, data, { upsert: true }).catch(function (err) {
                                    bakar.error(err);
                                });
                            } catch (e) {
                                bakar.error(e);
                            }
                        } else {
                            bakar.info('Urls do not match');
                        }
                    }*/
                    return batch + 1;
                }).catch(function (err) {
                    bakar.error('Error processing batch ', batch, err);
                    return batch + 1;
                });
            } catch (e) {
                bakar.error(e);
            }
        });

    }, Q(startBatch));
    reply('success');
};

MainController.prototype.deepTrain = function (request, reply) {
    var batchSize = 100;
    var startBatch = 87;
    var loopCount = 10;
    var batchArr = [];
    var pChain = Q();
    for (var i = startBatch; i < startBatch + loopCount; i++) {
        batchArr.push(i);
    }
    batchArr.reduce(function (p, args) {
        return p.delay(3000).then(function (batch) {
            try {
                return models.Pixie.find({}, {url: 1, userId: 1, professional: 1 }).limit(batchSize).skip(batch * batchSize).exec().then(function (profiles) {
                    bakar.debug('Processing batch', batch);
                    bakar.debug(profiles.length);
                    console.info('Processing batch', batch);
                    console.log(profiles.length);
                    return validate(profiles);
                }).then(function (imgArr){
                	console.info('Adding inputs for ', batch + ', with ' + imgArr.length + ' images');
                	return clarifaiAddInputs(imgArr);
                }).then(function (imgResults) {
                    return batch + 1;
                }).catch(function (err) {
                    bakar.error('Error processing batch ', batch, err);
                    return batch + 1;
                });
            } catch (e) {
                bakar.error(e);
            }
        });

    }, Q(startBatch));
    reply('success');
};

MainController.prototype.deleteAllInputs = function () {
	app.inputs.delete().then(
	    function(response) {
	      // do something with response
	    },
	    function(err) {
	      // there was an error
	    }
	  );
}

MainController.prototype.createModel = function () {
	createModel();
}

MainController.prototype.predict = function (request, reply) {
    predictModel(url);
};

function validate(profiles){
	let arr = [];
    let imgChain = Q(arr);
    for (var idx in profiles) {
	    let profile = profiles[idx];
	    imgChain = imgChain.then(function (imgArr){
	    	return Q.Promise(function (resolve, reject) {
	    		bakar.info(profile.url);
		        Reqst(profile.url, function (error, response, body) {
		            if (response && response.statusCode == 200) {
		            	imgArr.push({
		            		'id': profile.userId,
		                	'url': profile.url,
		                	'concepts': [
		                		{
		                			id: "professional",
		                			value: profile.professional	
		                		}
		                	],
		                });
		            } else {
		                bakar.error('Img error', profile.url, error);
		            }
		            resolve(imgArr);

		        });
		    });
	    });
	}
	return imgChain;
}

function clarifaiAddInputs(inputs) {
	console.log('Adding ' + inputs.length + ' inputs');
	// console.log(inputs);
	return app.inputs.create(inputs).then(
	  // createModel,
	  function (res){
	  	// console.log(res.length);
	  },
	  errorHandler
	);
}

/* Get tags for images array */
function getTags(arr) {
    //bakar.debug('Array passing', arr);
    return Clarifai.getTagsByUrl(
        arr,
        // 'https://scontent.xx.fbcdn.net/v/t1.0-1/s200x200/15894610_10210173448966365_6671014889172834985_n.jpg?oh=a50020a2d30aa4923b75b60d790940cf&oe=58D8CA9A',
        {
            'model': 'general-v1.3',
            //'selectClasses': ['happiness', 'confidence', 'pretty', 'fine-looking', 'cheerful', 'recreation', 'fun']
            'selectClasses': ['sharp', 'noise', 'perfection', 'teeth', 'sunglasses', 'laughing', 'approach', 'attractive', 'influence', 'oval', 'neutral', 'symmetrical', 'relaxation', 'happiness', 'confidence', 'intelligence', 'cheerful', 'fine-looking', 'no person', 'nude', 'serious', 'one', 'blur', 'freshness', 'relaxation', 'quality', 'eye contact', 'background', 'business', 'success', 'corporate', 'leader', 'business', 'side view', 'fashion', 'youth', 'attitude', 'content', 'contemplation', 'girl', 'joy', 'pretty', 'fun', 'recreation', 'spotlight', 'outfit', 'lifestyle', 'headshot', 'pose']
        }
    ).catch(function (err) {
        bakar.error('Error in clarify api', err);
    });
}

/* Get tags for images : API version 2 */
function getTagsv2(arr) {
    return app.models.predict(Clarifai.GENERAL_MODEL,
        arr
    ).catch(function (err) {
        bakar.error('Error in clarify api', err);
    });
}

function getAllTags(reply) {
    var headers = {
        'Authorization': 'Bearer 1walrV1aLjCrOKRlgdva06Yjfr8Nrs',
        'Content-Type': 'application/json'
    };
    Wreck.get('https://api.clarifai.com/v2/models/aaa03c23b3724a16a56b629203edc62c/output_info', {
        timeout: 20000,
        json: true,
        headers: headers
    }, (err, res, response) => {
        if (!err) {
            //bakar.info(response);
            // reply(response);
            console.log('Fetched all tags...');
            let json = response.model.output_info.data.concepts,
                arr = [];
            for (let i = 0; i < json.length; i++) {
                arr.push(json[i].name);
            }
            arr = JSON.stringify(arr);
            console.log('writing all tags...');
            fs.writeFile('tags.json', arr, 'utf8', function (err) {
                if (err) throw err;
                console.log('Completed...............*******.....///');
            }); // write it back 
        } else {
            bakar.error('Error retrieving tags', err);
            //reject(err);
        }
    });
}

function handleResponse(res) {
    // console.log(res.results);
}

// function clarifaiAddInputs(inputs, reply) {
//     console.log('Adding ' + inputs.length + ' inputs');
//     app.inputs.create(inputs).then(
//         // createModel,
//         function (res) {
//             console.log(res.length);
//         },
//         errorHandler
//     );
// }

// once inputs are created, create model by giving name and list of concepts
function createModel() {
    console.log('Creating model...');
    app.models.create('deepshit', ["professional"]).then(
        trainModel,
        errorHandler
    );
}

// after model is created, you can now train the model
function trainModel(model) {
    console.log('Model created...');
    console.log('Commencing training...');
    model.train().then(
        function (res) {
            console.log('Finished training...');
            console.log(res);
            reply(reply);
        },
        errorHandler
    );
}

// after training the model, you can now use it to predict on other inputs
function predictModel(model) {
    model.predict(['https://samples.clarifai.com/dog3.jpeg', 'https://samples.clarifai.com/cat3.jpeg']).then(
        function (response) {
            console.log(response);
        }, errorHandler
    );
}


MainController.prototype.markConcepts = function (request, reply) {
    bakar.debug('Marking concepts...');
    //getTags();
    //getAllTags(reply);
    var batchSize = 300;
    var startBatch = 0;
    var loopCount = 70;
    var batchArr = [];
    var pChain = Q();
    for (var i = startBatch; i < startBatch + loopCount; i++) {
        batchArr.push(i);
    }
    bakar.debug('Batches', batchArr.length);
    batchArr.reduce(function (p, args) {
        return p.then(function (batch) {
            try {
                return models.Pixie.find().limit(batchSize).skip(batch * batchSize).exec().then(function (candidates) {
                    bakar.debug('Processing batch', batch);
                    bakar.debug(candidates.length);
                    for (var i in candidates) {
                        let profile = candidates[i];
                        profile.professional = isPro(profile);
                        profile.save();
                    }
                    return batch + 1;
                }).catch(function (err) {
                    bakar.error('Error processing batch ', batch, err);
                    return batch + 1;
                });
            } catch (e) {
                bakar.error(e);
            }
        });

    }, Q(startBatch));
    reply('success');
};

function isPro(profile) {
    //basic filters
    let tags = profile.tags;
    try {
        return !isCrap(tags) && (isPolished(tags) || hasTolerableDirt(tags));
    } catch (err) {
        if (err instanceof Rejection) {
            return false;
        } else {
            bakar.error(err);
        }
    }
}

// stage 1 
function isCrap(tags) {
    let failTags = ['two', 'no person', 'group', 'cutout', 'religion', 'three', 'family', 'many', 'four', 'sadness', 'blur', 'god', 'nude'];

    return tags.some(function (t) {
        return failTags.indexOf(t.name) !== -1;
    });
}

// stage 2
function isPolished(tags) {
    //bakar.debug('First check');
    let failTags = { 'sunglasses': 0, 'outdoors': 0.85, 'serious': 0 };
    let conditionalDirt = ['car', 'vehicle'];
    let orTags = { 'achievement': 0, 'corporate': 0, 'fine-looking': 0, 'executive': 0, 'success': 0, 'intelligence': 0, 'professional': 0, 'leadership': 0, 'business': 0.85, 'politician': 0.85, 'confidence': 0.9, 'leader': 0.85, 'promotion': 0.8 };

    if (tags.some(function (t) {
            return failTags.hasOwnProperty(t.name) && (t.score >= failTags[t.name]);
        })) {
        throw new Rejection();
    }
    //bakar.debug('Passed exit criteria');
    let orResult = tags.some(function (t) {
        return orTags.hasOwnProperty(t.name) && (t.score >= orTags[t.name]);
    });

    if (!orResult && tags.some(function (t) {
            return conditionalDirt.indexOf(t.name) !== -1;
        })) {
        throw new Rejection();
    }
    return orResult;
}

// stage 3
function hasTolerableDirt(tags) {
    //bakar.debug('Last check');
    let failTags = ['laughing'];
    let conditionalDirt = ['offense', 'side view'];
    let orTags = { 'smart': 0, 'smile': 0, 'beautiful': 0, 'cute': 0, 'pretty': 0, 'model': 0, 'relaxation': 0, 'happiness': 0, 'confidence': 0, 'cheerful': 0, 'eyeglasses': 0, 'satisfaction': 0, 'accomplishment': 0 };

    if (tags.some(function (t) {
            return failTags.indexOf(t.name) !== -1;
        })) {
        throw new Rejection();
    }
    //bakar.debug('Passed exit criteria');
    let orResult = tags.some(function (t) {
        return orTags.hasOwnProperty(t.name) && (t.score >= orTags[t.name]);
    });


    if (!orResult && tags.some(function (t) {
            return conditionalDirt.indexOf(t.name) !== -1;
        })) {
        throw new Rejection();
    }
    return orResult;
}


function errorHandler(err) {
    // console.error(err);
    console.log('error adding input...');
    console.error(err);
}

class Rejection extends Error {
    /**
     * Constructs the MyError class
     * @param {String} message an error message
     * @constructor
     */
    constructor(profile, message) {
        super(message);
        // properly capture stack trace in Node.js
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.message = message;
        this.profile = profile;
    }
}

module.exports = new MainController();