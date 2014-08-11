var _ = require('underscore');

exports.ApiServer = function(options) {
    var self = this;
    self.options = _.extend({}, options);

    self.verifyRequest = function (req, res) {
        return true;
    }
}