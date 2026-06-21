import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, ScrollView, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useQuery } from '@tanstack/react-query';
import { advisorRepository } from '../../../shared/api';
import { useAuthStore } from '../../../shared/store';
import { Palette, Colors, Spacing, Radius, Shadow } from '../../../shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRONTEND_URL = 'https://frontend-tellar.vercel.app';

export const AdvisorQRScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [magnified, setMagnified] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const qrRef = useRef<any>(null);
  const qrRefLarge = useRef<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['advisor-me'],
    queryFn: () => advisorRepository.getMe(),
    staleTime: 10 * 60 * 1000,
  });

  const advisor = data?.data as any;
  const advisorId = advisor?.id ?? '';
  const profileUrl = `${FRONTEND_URL}/advisors/${advisorId}`;
  const advisorName = advisor?.fullName ?? user?.fullName ?? 'Advisor';
  const businessName = advisor?.businessName ?? '';
  const location = advisor?.location ?? '';

  const handleDownloadPDF = () => {
    if (!advisorId) {
      Alert.alert('Not ready', 'Advisor profile not loaded yet. Please wait.');
      return;
    }
    qrRefLarge.current?.toDataURL(async (base64Data: string) => {
      try {
        setGeneratingPDF(true);
        const html = buildPDFHTML({ base64Data, advisorName, businessName, location, profileUrl });
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Save or Share your BrokerSaab QR Card',
        });
      } catch (err: any) {
        Alert.alert('Error', 'Could not generate PDF. Please try again.');
        console.error('[QR PDF]', err);
      } finally {
        setGeneratingPDF(false);
      }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={s.loadingText}>Loading your QR code…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const QR_DISPLAY_SIZE = SCREEN_WIDTH * 0.56;
  const QR_MODAL_SIZE = SCREEN_WIDTH * 0.78;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header band */}
        <View style={s.headerBand}>
          <Text style={s.headerTagline}>Your Professional QR Code</Text>
          <Text style={s.headerSub}>Share with clients to let them view your profile instantly</Text>
        </View>

        {/* Main card */}
        <View style={s.mainCard}>
          {/* Card top strip */}
          <View style={s.cardStrip}>
            <View style={s.stripDot} />
            <Text style={s.stripText}>BROKERSAAB</Text>
            <View style={s.stripDot} />
          </View>

          {/* QR code area */}
          <TouchableOpacity style={s.qrWrapper} onPress={() => setMagnified(true)} activeOpacity={0.85}>
            <View style={s.qrFrame}>
              {/* Corner decorations */}
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />

              <QRCode
                value={profileUrl || 'https://frontend-tellar.vercel.app'}
                size={QR_DISPLAY_SIZE}
                color={Colors.navy[900]}
                backgroundColor="transparent"
                getRef={qrRef}
                logo={undefined}
                quietZone={8}
              />
            </View>
            <Text style={s.tapHint}>Tap to magnify</Text>
          </TouchableOpacity>

          {/* Scan label */}
          <View style={s.scanLabelWrap}>
            <View style={s.scanLine} />
            <Text style={s.scanLabel}>SCAN TO VIEW PROFILE</Text>
            <View style={s.scanLine} />
          </View>

          {/* Advisor info */}
          <Text style={s.advisorName}>{advisorName}</Text>
          {businessName ? <Text style={s.businessName}>{businessName}</Text> : null}
          {location ? <Text style={s.locationText}>📍 {location}</Text> : null}

          {/* URL chip */}
          <View style={s.urlChip}>
            <Text style={s.urlText} numberOfLines={1}>{profileUrl}</Text>
          </View>
        </View>

        {/* Download button */}
        <TouchableOpacity
          style={[s.downloadBtn, generatingPDF && s.downloadBtnDisabled]}
          onPress={handleDownloadPDF}
          disabled={generatingPDF || !advisorId}
          activeOpacity={0.85}
        >
          {generatingPDF ? (
            <View style={s.btnRow}>
              <ActivityIndicator size="small" color={Colors.navy[900]} />
              <Text style={s.downloadBtnText}>Generating PDF…</Text>
            </View>
          ) : (
            <View style={s.btnRow}>
              <Text style={s.downloadIcon}>⬇</Text>
              <Text style={s.downloadBtnText}>Download QR Card as PDF</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.pdfHint}>
          A premium branded PDF card will be generated that you can save, print, or send to clients.
        </Text>

        {/* Hidden large QR for PDF export */}
        <View style={s.hiddenQR}>
          <QRCode
            value={profileUrl || 'https://frontend-tellar.vercel.app'}
            size={500}
            color={Colors.navy[900]}
            backgroundColor="transparent"
            getRef={qrRefLarge}
            quietZone={12}
          />
        </View>
      </ScrollView>

      {/* Magnified modal */}
      <Modal visible={magnified} transparent animationType="fade" onRequestClose={() => setMagnified(false)}>
        <TouchableOpacity style={s.modalOverlay} onPress={() => setMagnified(false)} activeOpacity={1}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalBrand}>BROKERSAAB</Text>
              <TouchableOpacity onPress={() => setMagnified(false)} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.modalQRWrap}>
              <View style={s.modalQRFrame}>
                <View style={[s.corner, s.cornerTL, s.cornerLarge]} />
                <View style={[s.corner, s.cornerTR, s.cornerLarge]} />
                <View style={[s.corner, s.cornerBL, s.cornerLarge]} />
                <View style={[s.corner, s.cornerBR, s.cornerLarge]} />
                <QRCode
                  value={profileUrl || 'https://frontend-tellar.vercel.app'}
                  size={QR_MODAL_SIZE}
                  color={Colors.navy[900]}
                  backgroundColor="transparent"
                  quietZone={12}
                />
              </View>
            </View>

            <View style={s.modalScanRow}>
              <View style={s.scanLine} />
              <Text style={s.modalScanText}>SCAN TO VIEW PROFILE</Text>
              <View style={s.scanLine} />
            </View>
            <Text style={s.modalName}>{advisorName}</Text>
            {businessName ? <Text style={s.modalBiz}>{businessName}</Text> : null}

            <TouchableOpacity
              style={[s.modalDownloadBtn, generatingPDF && s.downloadBtnDisabled]}
              onPress={() => { setMagnified(false); setTimeout(handleDownloadPDF, 300); }}
              disabled={generatingPDF}
            >
              <Text style={s.downloadBtnText}>⬇  Download as PDF</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── PDF HTML Template ────────────────────────────────────────────────────────

function buildPDFHTML(opts: {
  base64Data: string;
  advisorName: string;
  businessName: string;
  location: string;
  profileUrl: string;
}): string {
  const { base64Data, advisorName, businessName, location, profileUrl } = opts;
  const qrSrc = `data:image/png;base64,${base64Data}`;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BrokerSaab Profile QR — ${advisorName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

  /* ── Diagonal watermark — tiled, very faint, only visible up close ── */
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 99999;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Ctext x='90' y='90' text-anchor='middle' dominant-baseline='middle' font-family='Arial%2C sans-serif' font-size='13' font-weight='700' letter-spacing='2' fill='%230B1F3A' fill-opacity='0.055' transform='rotate(-45 90 90)'%3EBrokerSaab%3C/text%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 180px 180px;
  }

  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    background: #F0F4FF;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 32px 20px;
    position: relative;
  }

  .page {
    width: 100%;
    max-width: 560px;
    background: #ffffff;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(11,31,58,0.22), 0 8px 24px rgba(11,31,58,0.12);
  }

  /* ── Top header ── */
  .header {
    background: linear-gradient(135deg, #0B1F3A 0%, #163655 60%, #1E4D7B 100%);
    padding: 36px 40px 28px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(212,175,55,0.08);
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: -40px; left: -40px;
    width: 150px; height: 150px;
    border-radius: 50%;
    background: rgba(99,102,241,0.1);
  }
  .logo-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
  }
  .logo-emblem {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #D4AF37, #F0D878);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 900;
    color: #0B1F3A;
    box-shadow: 0 4px 12px rgba(212,175,55,0.4);
    flex-shrink: 0;
  }
  .logo-text-wrap { text-align: left; }
  .logo-name {
    font-size: 24px;
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: 0.5px;
    line-height: 1;
  }
  .logo-tagline {
    font-size: 10px;
    font-weight: 600;
    color: #D4AF37;
    letter-spacing: 2px;
    margin-top: 3px;
  }
  .header-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent);
    margin: 18px 0 16px;
    position: relative; z-index: 1;
  }
  .header-subtitle {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.55);
    letter-spacing: 3px;
    text-transform: uppercase;
    position: relative; z-index: 1;
  }

  /* ── Gold accent band ── */
  .gold-band {
    height: 4px;
    background: linear-gradient(90deg, #D4AF37, #F0D878, #D4AF37);
  }

  /* ── Body ── */
  .body {
    padding: 36px 40px;
    background: #FFFFFF;
    text-align: center;
  }

  .scan-title {
    font-size: 13px;
    font-weight: 800;
    color: #4F46E5;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .scan-title::before, .scan-title::after {
    content: '';
    flex: 1;
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #4F46E5);
  }
  .scan-title::after {
    background: linear-gradient(90deg, #4F46E5, transparent);
  }

  /* ── QR Container ── */
  .qr-container {
    display: inline-block;
    position: relative;
    padding: 24px;
    background: #FAFBFF;
    border-radius: 24px;
    border: 2px solid #E8EAFF;
    box-shadow:
      0 0 0 6px rgba(79,70,229,0.06),
      0 8px 32px rgba(79,70,229,0.12),
      inset 0 1px 0 rgba(255,255,255,0.8);
    margin-bottom: 32px;
  }
  .qr-img {
    display: block;
    width: 240px;
    height: 240px;
    image-rendering: pixelated;
  }

  /* Corner decorations */
  .qr-corner {
    position: absolute;
    width: 22px; height: 22px;
    border-color: #D4AF37;
    border-style: solid;
  }
  .qr-corner.tl { top: 10px; left: 10px; border-width: 3px 0 0 3px; border-radius: 5px 0 0 0; }
  .qr-corner.tr { top: 10px; right: 10px; border-width: 3px 3px 0 0; border-radius: 0 5px 0 0; }
  .qr-corner.bl { bottom: 10px; left: 10px; border-width: 0 0 3px 3px; border-radius: 0 0 0 5px; }
  .qr-corner.br { bottom: 10px; right: 10px; border-width: 0 3px 3px 0; border-radius: 0 0 5px 0; }

  /* ── Advisor info ── */
  .advisor-name {
    font-size: 26px;
    font-weight: 900;
    color: #0B1F3A;
    letter-spacing: -0.3px;
    margin-bottom: 6px;
  }
  .advisor-biz {
    font-size: 14px;
    font-weight: 600;
    color: #4F46E5;
    margin-bottom: 6px;
  }
  .advisor-location {
    font-size: 12px;
    color: #64748B;
    font-weight: 500;
    margin-bottom: 24px;
  }

  /* ── URL chip ── */
  .url-chip {
    display: inline-block;
    background: #F0F4FF;
    border: 1px solid #C7D2FE;
    border-radius: 100px;
    padding: 8px 20px;
    font-size: 11px;
    color: #4F46E5;
    font-weight: 700;
    letter-spacing: 0.3px;
    word-break: break-all;
    margin-bottom: 0;
  }

  /* ── Bottom stripe ── */
  .footer {
    background: linear-gradient(135deg, #0B1F3A 0%, #163655 100%);
    padding: 20px 40px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .footer-left {
    text-align: left;
  }
  .footer-brand {
    font-size: 13px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: 0.3px;
  }
  .footer-copy {
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    margin-top: 2px;
  }
  .footer-badge {
    background: linear-gradient(135deg, #D4AF37, #F0D878);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 10px;
    font-weight: 800;
    color: #0B1F3A;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .gold-band-bottom {
    height: 4px;
    background: linear-gradient(90deg, #D4AF37, #F0D878, #D4AF37);
  }
</style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="logo-row">
        <div class="logo-emblem">B</div>
        <div class="logo-text-wrap">
          <div class="logo-name">BrokerSaab</div>
          <div class="logo-tagline">Insurance Advisory Platform</div>
        </div>
      </div>
      <div class="header-divider"></div>
      <div class="header-subtitle">Verified Advisor Profile Card</div>
    </div>

    <!-- Gold accent -->
    <div class="gold-band"></div>

    <!-- Body -->
    <div class="body">

      <div class="scan-title">Scan to View My Profile</div>

      <!-- QR code -->
      <div class="qr-container">
        <div class="qr-corner tl"></div>
        <div class="qr-corner tr"></div>
        <div class="qr-corner bl"></div>
        <div class="qr-corner br"></div>
        <img class="qr-img" src="${qrSrc}" alt="Profile QR Code"/>
      </div>

      <!-- Advisor info -->
      <div class="advisor-name">${advisorName}</div>
      ${businessName ? `<div class="advisor-biz">${businessName}</div>` : ''}
      ${location ? `<div class="advisor-location">📍 ${location}</div>` : '<div style="margin-bottom:24px;"></div>'}

      <!-- URL chip -->
      <div class="url-chip">${profileUrl}</div>

    </div>

    <!-- Gold bottom accent -->
    <div class="gold-band-bottom"></div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <div class="footer-brand">BrokerSaab</div>
        <div class="footer-copy">© ${year} · India's Trusted Insurance Advisor Network</div>
      </div>
      <div class="footer-badge">VERIFIED ✓</div>
    </div>

  </div>
</body>
</html>`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_PADDING = Spacing.lg;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  scroll: { paddingBottom: Spacing.xxxl },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Palette.textSecondary, fontSize: 14 },

  // Header band
  headerBand: {
    backgroundColor: Colors.navy[800],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  headerTagline: { fontSize: 16, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

  // Main card
  mainCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl + 4,
    overflow: 'hidden',
    ...Shadow.gold,
    shadowOpacity: 0.18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },

  cardStrip: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  stripDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.gold[500],
  },
  stripText: {
    fontSize: 10, fontWeight: '900', color: Colors.gold[400],
    letterSpacing: 4,
  },

  qrWrapper: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  qrFrame: {
    position: 'relative',
    padding: 16,
    backgroundColor: '#FAFBFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.15)',
  },

  // Corner decorations on QR frame
  corner: {
    position: 'absolute',
    width: 18, height: 18,
    borderColor: Colors.gold[500],
    borderStyle: 'solid',
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
  cornerLarge: { width: 24, height: 24 },

  tapHint: { fontSize: 11, color: Colors.indigo[400], fontWeight: '600', marginTop: 10, letterSpacing: 0.3 },

  scanLabelWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: CARD_PADDING, gap: 10, marginBottom: Spacing.md,
  },
  scanLine: { flex: 1, height: 1, backgroundColor: Colors.indigo[300] + '60' },
  scanLabel: { fontSize: 10, fontWeight: '800', color: Colors.indigo[500], letterSpacing: 2.5 },

  advisorName: { textAlign: 'center', fontSize: 18, fontWeight: '900', color: Colors.navy[800], paddingHorizontal: CARD_PADDING },
  businessName: { textAlign: 'center', fontSize: 12, color: Colors.indigo[500], fontWeight: '600', marginTop: 3, paddingHorizontal: CARD_PADDING },
  locationText: { textAlign: 'center', fontSize: 11, color: Colors.slate[400], marginTop: 4, paddingHorizontal: CARD_PADDING },

  urlChip: {
    margin: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: '#F0F4FF',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.indigo[300] + '80',
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  urlText: { fontSize: 10, color: Colors.indigo[500], fontWeight: '700' },

  // Download
  downloadBtn: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.gold[500],
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.gold,
  },
  downloadBtnDisabled: { opacity: 0.6 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  downloadIcon: { fontSize: 16 },
  downloadBtnText: { fontSize: 15, fontWeight: '800', color: Colors.navy[900] },

  pdfHint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.slate[400],
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    lineHeight: 18,
  },

  // Hidden QR for PDF
  hiddenQR: { position: 'absolute', opacity: 0, top: -9999, left: -9999 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(11,31,58,0.88)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  modalCard: {
    width: '100%', maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl + 4,
    overflow: 'hidden',
    ...Shadow.md,
  },
  modalHeader: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalBrand: { fontSize: 12, fontWeight: '900', color: Colors.gold[400], letterSpacing: 3 },
  modalClose: { padding: 4 },
  modalCloseText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '700' },

  modalQRWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
  modalQRFrame: {
    position: 'relative',
    padding: 18,
    backgroundColor: '#FAFBFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.2)',
  },

  modalScanRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, gap: 10, marginBottom: Spacing.sm,
  },
  modalScanText: { fontSize: 9, fontWeight: '800', color: Colors.indigo[500], letterSpacing: 2.5 },
  modalName: { textAlign: 'center', fontSize: 17, fontWeight: '900', color: Colors.navy[800], paddingHorizontal: Spacing.lg },
  modalBiz: { textAlign: 'center', fontSize: 12, color: Colors.indigo[500], fontWeight: '600', marginTop: 4, paddingHorizontal: Spacing.lg },

  modalDownloadBtn: {
    margin: Spacing.lg,
    backgroundColor: Colors.gold[500],
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
