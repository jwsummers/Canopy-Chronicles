import React, { useState } from 'react';
import { withNavigation } from '@react-navigation/compat';
import { TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Button, Block, NavBar, Text, theme } from 'galio-framework';

import Icon from 'react-native-vector-icons/Ionicons';  // Using Ionicons for relevant icons
import Input from './Input';
import argonTheme from '../constants/Theme';

const { height, width } = Dimensions.get('window');
const iPhoneX = () => Platform.OS === 'ios' && (height === 812 || width === 812 || height === 896 || width === 896);


class Header extends React.Component {
  state = {
    searchFocused: false,
    searchText: '',
  };

  handleLeftPress = () => {
    const { back, navigation } = this.props;
    return (back ? navigation.goBack() : navigation.openDrawer());
  }

  renderSearch = () => {
    const { searchFocused, searchText } = this.state;
    const { onSearch } = this.props;

    const handleSearchIconPress = () => {
      if (searchFocused) {
        // Clear search text when 'x' is pressed
        this.setState({ searchText: '', searchFocused: false });
        onSearch && onSearch('');
      } else {
        this.setState({ searchFocused: true });
      }
    };

    return (
      <Input
        right
        color="black"
        style={styles.search}
        placeholder="Search..."
        placeholderTextColor="#8898AA"
        onFocus={() => this.setState({ searchFocused: true })}
        onBlur={() => this.setState({ searchFocused: false })}
        onChangeText={(text) => {
          this.setState({ searchText: text });
          onSearch && onSearch(text);
        }}
        value={searchText}
        iconContent={
          <TouchableOpacity
            style={styles.searchIcon}
            onPress={handleSearchIconPress}
          >
            <Icon 
              size={16} 
              color={theme.COLORS.MUTED} 
              name={searchFocused ? "close" : "search"} 
              family="Ionicons"
            />
          </TouchableOpacity>
        }
      />
    );
  }

  renderOptions = () => {
    const { navigation } = this.props;

    return (
      <Block row style={styles.options}>
        <Button shadowless style={[styles.tab, styles.divider]} onPress={() => navigation.navigate('AddGrow')}>
          <Block row middle>
            <Icon name="add-circle-outline" size={18} style={{ paddingRight: 8 }} color={argonTheme.COLORS.ICON} />
            <Text size={16} style={styles.tabTitle}>Add a Grow</Text>
          </Block>
        </Button>
        <Button shadowless style={styles.tab} onPress={() => navigation.navigate('Profile')}>
          <Block row middle>
            <Icon name="person-outline" size={18} style={{ paddingRight: 8 }} color={argonTheme.COLORS.ICON} />
            <Text size={16} style={styles.tabTitle}>Profile</Text>
          </Block>
        </Button>
      </Block>
    );
  }

  renderHeader = () => {
    const { search, options } = this.props;
    if (search || options) {
      return (
        <Block center>
          {search ? this.renderSearch() : null}
          {options ? this.renderOptions() : null}
        </Block>
      );
    }
  }

  render() {
    const { back, title, white, transparent, bgColor, iconColor, titleColor, navigation, ...props } = this.props;

    const noShadow = ['Search', 'Categories', 'Deals', 'Pro', 'Profile'].includes(title);
    const headerStyles = [
      !noShadow ? styles.shadow : null,
      transparent ? { backgroundColor: 'rgba(0,0,0,0)' } : null,
    ];

    const navbarStyles = [
      styles.navbar,
      bgColor && { backgroundColor: bgColor }
    ];

    return (
      <Block style={headerStyles}>
        <NavBar
          back={false}
          title={title}
          style={navbarStyles}
          transparent={transparent}
          left={
            <Icon
              name={back ? 'chevron-back' : 'menu'}  // Using Ionicons for menu/chevron
              size={24}
              onPress={this.handleLeftPress}
              color={iconColor || (white ? argonTheme.COLORS.WHITE : argonTheme.COLORS.ICON)}
              style={{ marginTop: 2 }}
            />
          }
          leftStyle={{ paddingVertical: 12, flex: 0.2 }}
          titleStyle={[
            styles.title,
            { color: argonTheme.COLORS[white ? 'WHITE' : 'HEADER'] },
            titleColor && { color: titleColor }
          ]}
          {...props}
        />
        {this.renderHeader()}
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    position: 'relative',
  },
  title: {
    width: '100%',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navbar: {
    paddingVertical: 0,
    paddingBottom: theme.SIZES.BASE * 1.5,
    paddingTop: iPhoneX ? theme.SIZES.BASE * 4 : theme.SIZES.BASE,
    zIndex: 5,
  },
  shadow: {
    backgroundColor: theme.COLORS.WHITE,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.2,
    elevation: 3,
  },
  notify: {
    backgroundColor: argonTheme.COLORS.LABEL,
    borderRadius: 4,
    height: theme.SIZES.BASE / 2,
    width: theme.SIZES.BASE / 2,
    position: 'absolute',
    top: 9,
    right: 12,
  },
  search: {
    height: 48,
    width: '100%',
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: argonTheme.COLORS.BORDER
  },
  searchIcon: {
    paddingHorizontal: 10,
  },
  options: {
    marginBottom: 24,
    marginTop: 10,
    elevation: 4,
  },
  tab: {
    backgroundColor: theme.COLORS.TRANSPARENT,
    width: width * 0.35,
    borderRadius: 0,
    borderWidth: 0,
    height: 24,
    elevation: 0,
  },
  tabTitle: {
    lineHeight: 19,
    fontWeight: '400',
    color: argonTheme.COLORS.HEADER
  },
});

export default withNavigation(Header);
