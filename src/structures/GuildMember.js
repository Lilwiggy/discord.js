const TextBasedChannel = require('./interfaces/TextBasedChannel');
const Role = require('./Role');
const Permissions = require('../util/Permissions');
const Collection = require('../util/Collection');
const Presence = require('./Presence').Presence;
const util = require('util');

/**
 * Represents a member of a guild on Discord.
 * @implements {TextBasedChannel}
 */
class GuildMember {
  constructor(guild, data) {
    /**
     * The client that instantiated this GuildMember
     * @name GuildMember#client
     * @type {Client}
     * @readonly
     */
    Object.defineProperty(this, 'client', { value: guild.client });

    /**
     * The guild that this member is part of
     * @type {Guild}
     */
    this.guild = guild;

    /**
     * The user that this guild member instance Represents
     * @type {User}
     */
    this.user = {};

    this._roles = [];
    if (data) this.setup(data);

    /**
     * The ID of the last message sent by the member in their guild, if one was sent
     * @type {?Snowflake}
     */
    this.lastMessageID = null;

    /**
     * The Message object of the last message sent by the member in their guild, if one was sent
     * @type {?Message}
     */
    this.lastMessage = null;
  }

  setup(data) {
      /**
   * The ID of the member's avatar
   * @type {string}
   */
    this.avatar = data.user.avatar;
    /**
     * Whether this member is deafened server-wide
     * @type {boolean}
     */
    this.serverDeaf = data.deaf;

    /**
     * Whether this member is muted server-wide
     * @type {boolean}
     */
    this.serverMute = data.mute;

    /**
     * Whether this member is self-muted
     * @type {boolean}
     */
    this.selfMute = data.self_mute;

    /**
     * Whether this member is self-deafened
     * @type {boolean}
     */
    this.selfDeaf = data.self_deaf;

    /**
     * The voice session ID of this member, if any
     * @type {?Snowflake}
     */
    this.voiceSessionID = data.session_id;

    /**
     * The voice channel ID of this member, if any
     * @type {?Snowflake}
     */
    this.voiceChannelID = data.channel_id;

    /**
     * Whether this member is speaking
     * @type {boolean}
     */
    this.speaking = false;

    /**
     * The nickname of this guild member, if they have one
     * @type {?string}
     */
    this.nickname = data.nick || null;

    /**
     * The timestamp the member joined the guild at
     * @type {number}
     */
    this.joinedTimestamp = new Date(data.joined_at).getTime();

    this.user = data.user;
    this._roles = data.roles;
  }

  /**
   * The time the member joined the guild
   * @type {Date}
   * @readonly
   */
  get joinedAt() {
    return new Date(this.joinedTimestamp);
  }

  /**
   * The presence of this guild member
   * @type {Presence}
   * @readonly
   */
  get presence() {
    return this.frozenPresence || this.guild.presences.get(this.id) || new Presence();
  }

  /**
   * A list of roles that are applied to this GuildMember, mapped by the role ID
   * @type {Collection<Snowflake, Role>}
   * @readonly
   */
  get roles() {
    const list = new Collection();
    const everyoneRole = this.guild.roles.get(this.guild.id);

    if (everyoneRole) list.set(everyoneRole.id, everyoneRole);

    for (const roleID of this._roles) {
      const role = this.guild.roles.get(roleID);
      if (role) list.set(role.id, role);
    }

    return list;
  }

  /**
   * A link to the member's avatar
   * @type {string}
   * @readonly
   */
  get avatarURL() {
    return this.user.avatarURL;
  }

  /**
   * A link to the member's default avatar
   * @type {string}
   * @readonly
   */
  get defaultAvatarURL() {
    return this.user.defaultAvatarURL;
  }

  /**
   * A discriminator based on username for the member
   * @type {string}
   * @readonly
   */
  get discriminator() {
    return this.user.discriminator;
  }

  /**
   * The DM between the client's user and this member
   * @type {DMChannel}
   * @readonly
   */
  get dmChannel() {
    return this.user.dmChannel;
  }

  /**
   * The note that is set for the member
   * <warn>This is only available when using a user account.</warn>
   * @type {?string}
   * @readonly
   */
  get note() {
    return this.user.note;
  }

  /**
   * The Discord "tag" for this user
   * @type {string}
   * @readonly
   */
  get tag() {
    return this.user.tag;
  }

  /**
   * Whether or not the member is a bot
   * @type {Boolean}
   * @readonly
   */
  get bot() {
    return this.user.bot;
  }

  /**
   * The role of the member with the highest position
   * @type {Role}
   * @readonly
   */
  get highestRole() {
    return this.roles.reduce((prev, role) => !prev || role.comparePositionTo(prev) > 0 ? role : prev);
  }

  /**
   * The role of the member used to set their color
   * @type {?Role}
   * @readonly
   */
  get colorRole() {
    const coloredRoles = this.roles.filter(role => role.color);
    if (!coloredRoles.size) return null;
    return coloredRoles.reduce((prev, role) => !prev || role.comparePositionTo(prev) > 0 ? role : prev);
  }

  /**
   * The displayed color of the member in base 10
   * @type {number}
   * @readonly
   */
  get displayColor() {
    const role = this.colorRole;
    return (role && role.color) || 0;
  }

  /**
   * The displayed color of the member in hexadecimal
   * @type {string}
   * @readonly
   */
  get displayHexColor() {
    const role = this.colorRole;
    return (role && role.hexColor) || '#000000';
  }

  /**
   * The role of the member used to hoist them in a separate category in the users list
   * @type {?Role}
   * @readonly
   */
  get hoistRole() {
    const hoistedRoles = this.roles.filter(role => role.hoist);
    if (!hoistedRoles.size) return null;
    return hoistedRoles.reduce((prev, role) => !prev || role.comparePositionTo(prev) > 0 ? role : prev);
  }

  /**
   * Whether this member is muted in any way
   * @type {boolean}
   * @readonly
   */
  get mute() {
    return this.selfMute || this.serverMute;
  }

  /**
   * Whether this member is deafened in any way
   * @type {boolean}
   * @readonly
   */
  get deaf() {
    return this.selfDeaf || this.serverDeaf;
  }

  /**
   * The voice channel this member is in, if any
   * @type {?VoiceChannel}
   * @readonly
   */
  get voiceChannel() {
    return this.guild.channels.get(this.voiceChannelID);
  }

  /**
   * The ID of this user
   * @type {Snowflake}
   * @readonly
   */
  get id() {
    return this.user.id;
  }

  /**
   * The username of the member
   * @type {string}
   * @readonly
   */
  get username() {
    return this.user.username;
  }

  /**
   * The nickname of the member, or their username if they don't have one
   * @type {string}
   * @readonly
   */
  get displayName() {
    return this.nickname || this.user.username;
  }

  /**
   * The overall set of permissions for the guild member, taking only roles into account
   * @type {Permissions}
   * @readonly
   */
  get permissions() {
    if (this.user.id === this.guild.ownerID) return new Permissions(this, Permissions.ALL);

    let permissions = 0;
    const roles = this.roles;
    for (const role of roles.values()) permissions |= role.permissions;

    return new Permissions(this, permissions);
  }

  /**
   * Whether the member is kickable by the client user
   * @type {boolean}
   * @readonly
   */
  get kickable() {
    if (this.user.id === this.guild.ownerID) return false;
    if (this.user.id === this.client.user.id) return false;
    const clientMember = this.guild.member(this.client.user);
    if (!clientMember.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) return false;
    return clientMember.highestRole.comparePositionTo(this.highestRole) > 0;
  }

  /**
   * Whether the member is bannable by the client user
   * @type {boolean}
   * @readonly
   */
  get bannable() {
    if (this.user.id === this.guild.ownerID) return false;
    if (this.user.id === this.client.user.id) return false;
    const clientMember = this.guild.member(this.client.user);
    if (!clientMember.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) return false;
    return clientMember.highestRole.comparePositionTo(this.highestRole) > 0;
  }

  /**
   * Get the amount of time the user has been typing in a channel for (in milliseconds), or -1 if they're not typing.
   * @param {ChannelResolvable} channel The channel to get the time in
   * @returns {number}
   */
  typingDurationIn(channel) {
    channel = this.client.resolver.resolveChannel(channel);
    return channel._typing.has(this.id) ? channel._typing.get(this.id).elapsedTime : -1;
  }

  /**
   * Check whether the user is typing in a channel.
   * @param {ChannelResolvable} channel The channel to check in
   * @returns {boolean}
   */
  typingIn(channel) {
    channel = this.client.resolver.resolveChannel(channel);
    return channel._typing.has(this.id);
  }

  /**
   * Get the time that the user started typing.
   * @param {ChannelResolvable} channel The channel to get the time in
   * @returns {?Date}
   */
  typingSinceIn(channel) {
    channel = this.client.resolver.resolveChannel(channel);
    return channel._typing.has(this.id) ? new Date(channel._typing.get(this.id).since) : null;
  }

  /**
   * Returns `channel.permissionsFor(guildMember)`. Returns permissions for a member in a guild channel,
   * taking into account roles and permission overwrites.
   * @param {ChannelResolvable} channel The guild channel to use as context
   * @returns {?Permissions}
   */
  permissionsIn(channel) {
    channel = this.client.resolver.resolveChannel(channel);
    if (!channel || !channel.guild) throw new Error('Could not resolve channel to a guild channel.');
    return channel.permissionsFor(this);
  }

  /**
   * Checks if any of the member's roles have a permission.
   * @param {PermissionResolvable|PermissionResolvable[]} permission Permission(s) to check for
   * @param {boolean} [explicit=false] Whether to require the role to explicitly have the exact permission
   * **(deprecated)**
   * @param {boolean} [checkAdmin] Whether to allow the administrator permission to override
   * (takes priority over `explicit`)
   * @param {boolean} [checkOwner] Whether to allow being the guild's owner to override
   * (takes priority over `explicit`)
   * @returns {boolean}
   */
  hasPermission(permission, explicit = false, checkAdmin, checkOwner) {
    if (typeof checkAdmin === 'undefined') checkAdmin = !explicit;
    if (typeof checkOwner === 'undefined') checkOwner = !explicit;
    if (checkOwner && this.user.id === this.guild.ownerID) return true;
    return this.roles.some(r => r.hasPermission(permission, undefined, checkAdmin));
  }

  /**
   * Checks whether the roles of the member allows them to perform specific actions.
   * @param {PermissionResolvable[]} permissions The permissions to check for
   * @param {boolean} [explicit=false] Whether to require the member to explicitly have the exact permissions
   * @returns {boolean}
   * @deprecated
   */
  hasPermissions(permissions, explicit = false) {
    if (!explicit && this.user.id === this.guild.ownerID) return true;
    return this.hasPermission(permissions, explicit);
  }

  /**
   * Checks whether the roles of the member allows them to perform specific actions, and lists any missing permissions.
   * @param {PermissionResolvable[]} permissions The permissions to check for
   * @param {boolean} [explicit=false] Whether to require the member to explicitly have the exact permissions
   * @returns {PermissionResolvable[]}
   */
  missingPermissions(permissions, explicit = false) {
    return this.permissions.missing(permissions, explicit);
  }

  /**
   * The data for editing a guild member.
   * @typedef {Object} GuildMemberEditData
   * @property {string} [nick] The nickname to set for the member
   * @property {Collection<Snowflake, Role>|RoleResolvable[]} [roles] The roles or role IDs to apply
   * @property {boolean} [mute] Whether or not the member should be muted
   * @property {boolean} [deaf] Whether or not the member should be deafened
   * @property {ChannelResolvable} [channel] Channel to move member to (if they are connected to voice)
   */

  /**
   * Edit a guild member.
   * @param {GuildMemberEditData} data The data to edit the member with
   * @param {string} [reason] Reason for editing this user
   * @returns {Promise<GuildMember>}
   * @example
   * // Set a member's nickname and clear their roles
   * message.member.edit({
   *   nick: 'Cool Name',
   *   roles: []
   * })
   *   .then(console.log)
   *   .catch(console.error);
   */
  edit(data, reason) {
    return this.client.rest.methods.updateGuildMember(this, data, reason);
  }

  /**
   * Mute/unmute a user.
   * @param {boolean} mute Whether or not the member should be muted
   * @param {string} [reason] Reason for muting or unmuting
   * @returns {Promise<GuildMember>}
   * @example
   * // Mute a member with a reason
   * message.member.setMute(true, 'It needed to be done')
   *   .then(() => console.log(`Muted ${message.member.displayName}`)))
   *   .catch(console.error);
   */
  setMute(mute, reason) {
    return this.edit({ mute }, reason);
  }

  /**
   * Deafen/undeafen a user.
   * @param {boolean} deaf Whether or not the member should be deafened
   * @param {string} [reason] Reason for deafening or undeafening
   * @returns {Promise<GuildMember>}
   * @example
   * // Deafen a member
   * message.member.setDeaf(true)
   *   .then(() => console.log(`Deafened ${message.member.displayName}`))
   *   .catch(console.error);
   */
  setDeaf(deaf, reason) {
    return this.edit({ deaf }, reason);
  }

  /**
   * Moves the guild member to the given channel.
   * @param {ChannelResolvable} channel The channel to move the member to
   * @returns {Promise<GuildMember>}
   * @example
   * // Moves a member to a voice channel
   * member.setVoiceChannel('174674066072928256')
   *   .then(() => console.log(`Moved ${member.displayName}`))
   *   .catch(console.error);
   */
  setVoiceChannel(channel) {
    return this.edit({ channel });
  }

  /**
   * Sets the roles applied to the member.
   * @param {Collection<Snowflake, Role>|RoleResolvable[]} roles The roles or role IDs to apply
   * @param {string} [reason] Reason for applying the roles
   * @returns {Promise<GuildMember>}
   * @example
   * // Set the member's roles to a single role
   * guildMember.setRoles(['391156570408615936'])
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // Remove all of the member's roles
   * guildMember.setRoles([])
   *   .then(member => console.log(`${member.displayName} now has ${member.roles.size} roles`))
   *   .catch(console.error);
   */
  setRoles(roles, reason) {
    return this.edit({ roles }, reason);
  }

  /**
   * Adds a single role to the member.
   * @param {RoleResolvable} role The role or ID of the role to add
   * @param {string} [reason] Reason for adding the role
   * @returns {Promise<GuildMember>}
   * @example
   * // Give a role to a member
   * message.member.addRole('193654001089118208')
   *   .then(console.log)
   *   .catch(console.error);
   */
  addRole(role, reason) {
    if (!(role instanceof Role)) role = this.guild.roles.get(role);
    if (!role) return Promise.reject(new TypeError('Supplied parameter was neither a Role nor a Snowflake.'));
    return this.client.rest.methods.addMemberRole(this, role, reason);
  }

  /**
   * Adds multiple roles to the member.
   * @param {Collection<Snowflake, Role>|RoleResolvable[]} roles The roles or role IDs to add
   * @param {string} [reason] Reason for adding the roles
   * @returns {Promise<GuildMember>}
   * @example
   * // Gives a member a few roles
   * message.member.addRoles(['193654001089118208', '369308579892690945'])
   *   .then(console.log)
   *   .catch(console.error);
   */
  addRoles(roles, reason) {
    let allRoles;
    if (roles instanceof Collection) {
      allRoles = this._roles.slice();
      for (const role of roles.values()) allRoles.push(role.id);
    } else {
      allRoles = this._roles.concat(roles);
    }
    return this.edit({ roles: allRoles }, reason);
  }

  /**
   * Removes a single role from the member.
   * @param {RoleResolvable} role The role or ID of the role to remove
   * @param {string} [reason] Reason for removing the role
   * @returns {Promise<GuildMember>}
   * @example
   * // Remove a role from a member
   * message.member.removeRole('193654001089118208')
   *   .then(console.log)
   *   .catch(console.error);
   */
  removeRole(role, reason) {
    if (!(role instanceof Role)) role = this.guild.roles.get(role);
    if (!role) return Promise.reject(new TypeError('Supplied parameter was neither a Role nor a Snowflake.'));
    return this.client.rest.methods.removeMemberRole(this, role, reason);
  }

  /**
   * Removes multiple roles from the member.
   * @param {Collection<Snowflake, Role>|RoleResolvable[]} roles The roles or role IDs to remove
   * @param {string} [reason] Reason for removing the roles
   * @returns {Promise<GuildMember>}
   * @example
   * // Removes a few roles from the member
   * message.member.removeRoles(['193654001089118208', '369308579892690945'])
   *   .then(console.log)
   *   .catch(console.error);
   */
  removeRoles(roles, reason) {
    const allRoles = this._roles.slice();
    if (roles instanceof Collection) {
      for (const role of roles.values()) {
        const index = allRoles.indexOf(role.id);
        if (index >= 0) allRoles.splice(index, 1);
      }
    } else {
      for (const role of roles) {
        const index = allRoles.indexOf(role instanceof Role ? role.id : role);
        if (index >= 0) allRoles.splice(index, 1);
      }
    }
    return this.edit({ roles: allRoles }, reason);
  }

  /**
   * Set the nickname for the guild member.
   * @param {string} nick The nickname for the guild member
   * @param {string} [reason] Reason for setting the nickname
   * @returns {Promise<GuildMember>}
   * @example
   * // Update the member's nickname
   * message.member.setNickname('Cool Name')
   *   .then(console.log)
   *   .catch(console.error);
   */
  setNickname(nick, reason) {
    return this.edit({ nick }, reason);
  }

  /**
   * Creates a DM channel between the client and the member.
   * @returns {Promise<DMChannel>}
   */
  createDM() {
    return this.user.createDM();
  }

  /**
   * Deletes any DMs with this guild member.
   * @returns {Promise<DMChannel>}
   */
  deleteDM() {
    return this.user.deleteDM();
  }

  /**
   * Kick this member from the guild.
   * @param {string} [reason] Reason for kicking user
   * @returns {Promise<GuildMember>}
   * @example
   * // Kick a member
   * member.kick()
   *   .then(() => console.log(`Kicked ${member.displayName}`))
   *   .catch(console.error);
   */
  kick(reason) {
    return this.client.rest.methods.kickGuildMember(this.guild, this, reason);
  }

  /**
   * Ban this guild member.
   * @param {Object|number|string} [options] Ban options. If a number, the number of days to delete messages for, if a
   * string, the ban reason. Supplying an object allows you to do both.
   * @param {number} [options.days=0] Number of days of messages to delete
   * @param {string} [options.reason] Reason for banning
   * @returns {Promise<GuildMember>}
   * @example
   * // Ban a guild member
   * member.ban(7)
   *   .then(() => console.log(`Banned ${member.displayName}`))
   *   .catch(console.error);
   */
  ban(options) {
    return this.guild.ban(this, options);
  }

  /**
   * When concatenated with a string, this automatically concatenates the user's mention instead of the Member object.
   * @returns {string}
   * @example
   * // Logs: Hello from <@123456789>!
   * console.log(`Hello from ${member}!`);
   */
  toString() {
    return `<@${this.nickname ? '!' : ''}${this.user.id}>`;
  }

  // These are here only for documentation purposes - they are implemented by TextBasedChannel
  /* eslint-disable no-empty-function */
  send() {}
  sendMessage() {}
  sendEmbed() {}
  sendFile() {}
  sendCode() {}
}

TextBasedChannel.applyToClass(GuildMember);

GuildMember.prototype.hasPermissions = util.deprecate(GuildMember.prototype.hasPermissions,
  'GuildMember#hasPermissions is deprecated - use GuildMember#hasPermission, it now takes an array');

module.exports = GuildMember;
