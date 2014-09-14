/**
 * Created by Administrator PC on 9/13/14.
 */
/**
 * Created by Administrator PC on 9/13/14.
 */
var utils = require('./../utils/Utils').Utils;
var MatchObject = module.exports.MatchObject = function (s) {
    var s = s || {};

    this.table = s.table || 'matches';
    s.field = s.field || {};

    var f = {};
    f.id = s.field.id || 0;
    f.player_1 = s.field.player_1 || '';
    f.player_2 = s.field.player_2 || '';
    f.year = s.field.year || '';
    f.tournament = s.field.tournament || '';

    this.field = f;
    return this;
}