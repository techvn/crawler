/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils').Utils,
    voteModel = require('./../../model/TF_Votes'),
    playerModel = require('./../../model/TF_Player'),
    matchModel = require('./../../model/TF_Matches'),
    historyModel = require('./../../model/TF_Histories'),
    historyDetailModel = require('./../../model/TF_HistoriesDetail');
function Get() {
    var self = this;

    // Get player detail
    // Params: id
    self.getPlayerDetail = function (req, res) {
        var result = playerModel.PlayerObject({'field': {
                'name': 'Roger Federer',
                'avatar': '',
                'birth': '8 August 1981',
                'country': 'Switzerland',
                'des': 'Federer has won the ATPWorldTour.com Fans\' Favourite Award a record eleven times straight (2003–2013) and the Stefan Edberg Sportsmanship Award (voted for by the players) a record nine times (2004–2009, 2011–2013)'
            }
            }
        ).field;
        result.matches = [
            {
                'time': '36/2014',
                'player_with': 'Rafael Nadal',
                'surface': 'hard',
                'tournament': 'US Open',
                'round': '342',
                'score': '4-6 7-6(4) 3-6',
                'win': false
            },
            {
                'time': '32/2010',
                'player_with': 'Steffi Graf',
                'surface': 'hard',
                'tournament': 'Australia Open',
                'round': '342',
                'score': '6-2 7-6(3)',
                'win': true
            }
        ]
        res.json(result);
    }

    /**
     * Load today's match (in week)
     * @param req
     * @param res
     */
    self.getMatchToday = function (req, res) {
        var result = [
            {
                'id': 1,
                'player_1': {
                    id: 1,
                    name: 'Federer',
                    avatar: 'Link avatar',
                    win: 15,
                    vote: 20
                },
                'player_2': {
                    id: 2,
                    name: 'Rafael Nadal',
                    avatar: 'Link avatar',
                    win: 15,
                    vote: 20
                },
                'week': '35/2014',
                'tournament': 'Davis Cup, ISR-ARG'
            },
            {
                'id': 2,
                'player_1': {
                    id: 8,
                    name: 'Betsy Abbas',
                    avatar: 'Link avatar',
                    win: 55,
                    vote: 22
                },
                'player_2': {
                    id: 5,
                    name: 'Ivana Abramović',
                    avatar: 'Link avatar',
                    win: 48,
                    vote: 17
                },
                'week': '35/2014',
                'tournament': 'US Open'
            }
        ];

        res.json(result);
    }

    /**
     * Load detail for head-to-head
     * @param rea
     * @param res
     */
    self.getHeadToHead = function (rea, res) {
        var result = {
            'id': 1,
            'year': '35/2014',
            'tournament': 'US Open',
            'player_1': {
                id: 1,
                name: 'Federer',
                avatar: 'Link avatar',
                win: 15,
                vote: 20,
                des: 'More info about player'
            },
            'player_2': {
                id: 2,
                name: 'Rafael Nadal',
                avatar: 'Link avatar',
                win: 15,
                vote: 20,
                des: 'More info about player'
            },
            'matches': [
                {
                    'time': '35/2012',
                    'surface': 'hard',
                    'tournament': 'US Ppen',
                    'round': '342',
                    'score': '4-6 7-6(4) 3-6',
                    'win': 'Roger Federer'
                }
            ]
        }
        res.json(result);
    }

    // News --------------
    self.getListNews = function (req, res) {
        var result = [
            {
                id: 1,
                title: 'Title of news',
                brief: 'Brief for news',
                link: 'Link detail of news if don\'t have crawled content',
                'thumb': 'Link to thumb image'
            },
            {
                id: 2,
                title: 'Title of news',
                brief: 'Brief for news',
                link: 'Link detail of news if don\'t have crawled content',
                'thumb': 'Link to thumb image'
            }
        ];
        res.json(result);
    }

    self.getNewDetail = function (req, res) {
        var result = {
            id: 1,
            title: 'Title of news',
            brief: 'Brief for news',
            link: 'Link detail of news if don\'t have crawled content',
            'thumb': 'Link to thumb image',
            content: 'Full description text hear'
        };
        res.json(result);
    }


    // Video -------------
    self.getListVideo = function (req, res) {
        var result = [
            {
                id: 1,
                title: 'Title of video video',
                brief: 'Brief for video',
                thumb: 'Link to thumb image'
            },
            {
                id: 2,
                title: 'Title of video video',
                brief: 'Brief for video',
                thumb: 'Link to thumb image'
            }
        ];
        res.json(result);
    }
    self.getVideoDetail = function (req, res) {
        var result = {
            id: 1,
            title: 'Title of video',
            brief: 'Brief for video',
            link: 'Link detail of news if don\'t have crawled content',
            thumb: 'Link to thumb image',
            content: 'Full description text hear',
            video: 'iframe embed or id of youtube link'
        };
        res.json(result);
    }


    // Check user voted or not by user_id, match_id and player
    self.getCheckUserVote = function (req, res) {
        var result = {};
        result['voted'] = true;
        result['vote_player'] = 1;

        res.json(result);
    }

}

exports.Get = new Get();