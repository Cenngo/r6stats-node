'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var axios = _interopDefault(require('axios'));

class MissingUserAgentError extends Error {}

class AuthenticationError extends Error {}

class NotAuthenticatedError extends Error {}

const playerStats = ({ uuid }) => ({
  method: 'get',
  url: `/stats/${uuid}`
});

const operatorStats = ({ uuid }) => ({
  method: 'get',
  url: `/stats/${uuid}/operators`
});

const seasonalStats = ({ uuid }) => ({
  method: 'get',
  url: `/stats/${uuid}/seasonal`
});

var Stats = { playerStats, operatorStats, seasonalStats };

const search = ({ username, platform }) => ({
  method: 'get',
  url: `/player-search/${username}/${platform}`
});

var Search = { search };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

class R6StatsAPI {
  constructor({ loginId, password, userAgent = null, baseUrl = null, options = null }) {
    if (!baseUrl) throw new Error('Base URL must be provided before release');
    if (!userAgent) throw new MissingUserAgentError('A user agent must be specified for client recognition');

    this.authConfig = { loginId, password };
    this.authData = { token: null };

    this.$axios = axios.create(this._baseConfig({ baseUrl, userAgent, options }));
  }

  async authenticate() {
    try {
      const { data: { payload: { token } } } = await this.$axios({
        method: 'post',
        url: '/auth/login',
        data: {
          login_id: this.authConfig.loginId,
          password: this.authConfig.password
        }
      });
      this.authData.token = token;
    } catch (e) {
      let msg;
      switch (e.response.status) {
        case 401:
          msg = 'Invalid login or password';
          break;
        case 422:
          msg = 'Login or password not provided';
          break;
        default:
          msg = 'Unknown authentication error occurred';
          break;
      }
      throw new AuthenticationError(msg);
    }
  }

  async call(config) {
    if (!this.isAuthenticated) throw new NotAuthenticatedError('The client must call .authenticate() before making API calls');
    return await this.$axios(_extends({
      headers: {
        'Authorization': `Bearer: ${this.authData.token}`
      }
    }, config));
  }

  async playerSearch({ username, platform }) {
    return this.call(Search.search({ username, platform }));
  }

  async playerStats({ uuid }) {
    return this.call(Stats.playerStats({ uuid }));
  }

  async operatorStats({ uuid }) {
    return this.call(Stats.operatorStats({ uuid }));
  }

  async seasonalStats({ uuid }) {
    return this.call(Stats.seasonalStats({ uuid }));
  }

  isAuthenticated() {
    return this.authData.token != null;
  }

  _baseConfig(config) {
    return _extends({
      baseURL: config.baseUrl,
      headers: {
        'User-Agent': config.userAgent,
        'Content-Type': 'application/json'
      }
    }, config.options);
  }
}

module.exports = R6StatsAPI;
