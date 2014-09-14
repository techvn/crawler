/**
 * Created by Administrator PC on 9/13/14.
 */
/**
 * Created by Administrator PC on 9/13/14.
 */
var utils = require('./../utils/Utils').Utils;
var VoteObject = module.exports.VoteObject = function (s) {
    var s = s || {};

    this.table = s.table || 'votes';
    s.field = s.field || {};

    var f = {};
    f.id = s.field.id || 0;
    f.user_id = s.field.user_id || '';
    f.match_id = s.field.match_id || 0;
    f.player_id = s.field.player_id || 0;

    this.field = f;
    return this;
}