import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { Block, Text, theme } from 'galio-framework';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../config/firebaseConfig';
import { argonTheme } from '../constants';
import Header from '../components/Header';

const { width, height } = Dimensions.get('screen');

const Grows = ({ navigation }) => {
  const [grows, setGrows] = useState([]);
  const [filteredGrows, setFilteredGrows] = useState([]);

  const fetchGrows = async () => {
    if (!auth.currentUser) {
      console.log('User is not authenticated!');
      return;
    }

    try {
      const q = query(
        collection(db, 'grows'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedGrows = [];
      querySnapshot.forEach((doc) => {
        fetchedGrows.push({ id: doc.id, ...doc.data() });
      });
      setGrows(fetchedGrows);
    } catch (error) {
      console.error('Error fetching grows:', error);
    }
  };

  // Use useFocusEffect to refetch grows when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchGrows();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchGrows(); // Refetch grows when returning to the screen
    });
    return unsubscribe; // Clean up the listener on component unmount
  }, [navigation]);

  useEffect(() => {
    setFilteredGrows(grows);
  }, [grows]);

  const handleSearch = (keyword) => {
    if (!keyword.trim()) {
      setFilteredGrows(grows);
      return;
    }

    const lowercasedKeyword = keyword.toLowerCase().trim();
    const filtered = grows.filter(grow =>
      grow.strainName.toLowerCase().includes(lowercasedKeyword) ||
      grow.status.toLowerCase().includes(lowercasedKeyword)
    );
    setFilteredGrows(filtered);
  };

  const renderGrowCard = (grow) => {
    const defaultImageUri = Image.resolveAssetSource(require('../assets/imgs/Default-Grow.png')).uri;
    
    return (
      <TouchableOpacity 
        key={grow.id} 
        style={styles.card} 
        onPress={() => navigation.navigate('GrowItem', { 
          growId: grow.id, 
          growName: grow.strainName,
        })}
      >
        <Image 
          source={{ uri: grow.imageUrl || defaultImageUri }} 
          style={styles.image} 
          defaultSource={require('../assets/imgs/Default-Grow.png')}
        />
        <Block style={styles.cardContent}>
          <Text size={18} bold>{grow.strainName}</Text>
          <Block row space="between">
            <Text style={[styles.statusText, grow.status === 'Active' ? styles.activeStatus : styles.completeStatus]}>
              {grow.status === 'Active' ? 'Active' : 'Complete'}
            </Text>
          </Block>
        </Block>
      </TouchableOpacity>
    );
  };

  return (
    <Block flex style={styles.screen}>
      <Header
        title="Grows"
        navigation={navigation}
        options
        search
        onSearch={handleSearch}
      />
      <ImageBackground 
        source={require('../assets/imgs/Dark-BG.jpg')} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.growsList}>
          {filteredGrows.length === 0 ? (
            <Text style={styles.noGrowsText}>No grows found</Text>
          ) : (
            filteredGrows.map((grow) => renderGrowCard(grow))
          )}
        </ScrollView>
      </ImageBackground>
    </Block>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: argonTheme.COLORS.BACKGROUND,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  growsList: {
    paddingVertical: theme.SIZES.BASE,
    paddingHorizontal: theme.SIZES.BASE,
  },
  card: {
    backgroundColor: argonTheme.COLORS.WHITE,
    borderRadius: 8,
    padding: theme.SIZES.BASE,
    marginBottom: theme.SIZES.BASE,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: '90%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
    alignSelf: 'center',
  },
  cardContent: {
    marginTop: theme.SIZES.BASE / 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeStatus: {
    color: argonTheme.COLORS.SUCCESS,
  },
  completeStatus: {
    color: argonTheme.COLORS.SECONDARY,
  },
  noGrowsText: {
    textAlign: 'center',
    marginTop: theme.SIZES.BASE,
    fontSize: 18,
    color: argonTheme.COLORS.MUTED,
  },
});

export default Grows;
