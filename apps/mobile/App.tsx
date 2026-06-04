import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';

interface Advisor {
  id: string;
  fullName: string;
  category: string;
  fee: number;
  rating: number;
}

const MOCK_ADVISORS: Advisor[] = [
  { id: '1', fullName: 'Advocate Rajesh Sen', category: 'Corporate Law', fee: 1500, rating: 4.9 },
  { id: '2', fullName: 'Meera Deshmukh', category: 'Property Broker', fee: 500, rating: 4.8 },
  { id: '3', fullName: 'CA Amit Singhania', category: 'Tax Consultant', fee: 2000, rating: 4.9 }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    if (phoneNumber.length >= 10) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = () => {
    if (otp === '123456') {
      setIsAuthenticated(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050E1B" />
      
      {!isAuthenticated ? (
        // MOBILE AUTHENTICATION FLOW
        <View style={styles.authContainer}>
          <Text style={styles.logoText}>BROKERSAAB</Text>
          <Text style={styles.subtitleText}>Your Trusted Advisor Marketplace</Text>
          
          <View style={styles.card}>
            {!otpSent ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ENTER MOBILE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor="#556"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
                <TouchableOpacity style={styles.btnGold} onPress={handleSendOtp}>
                  <Text style={styles.btnText}>Send OTP Verification</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ENTER 6-DIGIT OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 123456 (Use 123456 in dev)"
                  placeholderTextColor="#556"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity style={styles.btnGold} onPress={handleVerifyOtp}>
                  <Text style={styles.btnText}>Verify & Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.backBtn}>
                  <Text style={styles.backText}>Change Mobile Number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        // CLIENT DIRECTORY & DASHBOARD SCREEN
        <View style={styles.dashboardContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userText}>Premium Client</Text>
            </View>
            <TouchableOpacity style={styles.walletBadge}>
              <Text style={styles.walletText}>₹2,500.00</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Verified Professionals</Text>
          
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {MOCK_ADVISORS.map((advisor) => (
              <View key={advisor.id} style={styles.advisorCard}>
                <View style={styles.advisorHeader}>
                  <View style={styles.advisorAvatar}>
                    <Text style={styles.avatarText}>{advisor.fullName.split(' ').slice(-1)[0][0]}</Text>
                  </View>
                  <View style={styles.advisorDetails}>
                    <Text style={styles.advisorName}>{advisor.fullName}</Text>
                    <Text style={styles.advisorCategory}>{advisor.category}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {advisor.rating}</Text>
                  </View>
                </View>

                <View style={styles.advisorFooter}>
                  <View>
                    <Text style={styles.feeLabel}>CONSULTATION FEE</Text>
                    <Text style={styles.feeValue}>₹{advisor.fee}</Text>
                  </View>
                  <TouchableOpacity style={styles.bookBtn} onPress={() => alert(`Booking initiated for ${advisor.fullName}`)}>
                    <Text style={styles.bookBtnText}>Book Session</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.signOutBtn} onPress={() => setIsAuthenticated(false)}>
            <Text style={styles.signOutText}>Sign Out Node</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050E1B',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFE082',
    letterSpacing: 4,
  },
  subtitleText: {
    fontSize: 12,
    color: '#94A9C3',
    marginTop: 4,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    backgroundColor: '#0B1F3A',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  inputGroup: {
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(5, 14, 27, 0.8)',
    borderColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderRadius: 8,
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  btnGold: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#0B1F3A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backText: {
    color: '#D4AF37',
    fontSize: 12,
  },
  dashboardContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    color: '#94A9C3',
    fontSize: 12,
  },
  userText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  walletText: {
    color: '#FFE082',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFE082',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  advisorCard: {
    backgroundColor: '#0B1F3A',
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 1,
  },
  avatarText: {
    color: '#D4AF37',
    fontWeight: 'black',
    fontSize: 16,
  },
  advisorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  advisorName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  advisorCategory: {
    color: '#94A9C3',
    fontSize: 11,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
  },
  advisorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopColor: 'rgba(212, 175, 55, 0.05)',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  feeLabel: {
    fontSize: 8,
    color: '#94A9C3',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  bookBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#0B1F3A',
    fontWeight: 'bold',
    fontSize: 11,
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopColor: 'rgba(212, 175, 55, 0.1)',
    borderTopWidth: 1,
    marginTop: 16,
  },
  signOutText: {
    color: '#94A9C3',
    fontSize: 12,
  },
});
