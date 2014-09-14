/**
 * Created by Administrator PC on 9/13/14.
 */

var HistoryDetailObject = module.exports.HistoryDetailObject = function(s) {
    var s = s || {};

    this.table = s.table || 'histories_detail';

    var f = {};
    s.field = s.field || {};

    f.id = s.field.id || 0;
    f.headtohead_id = s.field.headtohead_id || 0;
    f.year = s.field.year || '';
    f.tournament = s.field.tournament || '';
    f.surface = s.field.surface || '';
    f.score = s.field.score || '';
    f.winner = s.field.winner || 0; // Name of player
    f.type = s.field.type || ''; // 1/4/ 1/2 or final

    this.field = f;

    return this;
}
