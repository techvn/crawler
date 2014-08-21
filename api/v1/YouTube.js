/**
 * Created by Administrator PC on 8/20/14.
 */

var utils = require('./../../utils/Utils').Utils,
    youTubeHtmlParse = require('./../../utils/YouTubeHtmlParse').YouTubeHtmlParse,
    youTubeModel = require('./../../model/YouTube'),
    setting = require('./../../setting');

function youTube() {
    var self = this;

    self.getDetail = function(req, res) {
        var url = req.query.url;
        if(url == null || url == '') {
            res.json({
                'err' : 'Url detail is invalided'
            });
        }

        // Read page
        youTubeHtmlParse.DetailScraper(url, function() {

        }, youTubeModel.YouTube());
    }
}