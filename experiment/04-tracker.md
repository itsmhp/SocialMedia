# 4. Tracker & Dashboard GO / ITERATE / KILL

[⬅️ 3. Template WhatsApp](03-template-whatsapp.md) · [Kit](README.md)

Gunakan [tracker-template.csv](tracker-template.csv) (impor ke Google Sheets / Excel). Satu **baris = satu Rencana**.

## Kolom

| Kolom | Arti |
| --- | --- |
| `plan_id` | ID rencana (P01, P02, ...) |
| `host` | nama host |
| `komunitas` | kampus / komunitas |
| `aktivitas` | mau ngapain |
| `tgl_dibuat` | tanggal rencana dibuat |
| `undangan_terkirim` | jumlah orang diundang |
| `vote_masuk` | jumlah yang ikut voting |
| `dikunci` | Y/N — waktu & tempat final diumumkan |
| `rsvp_ya` | jumlah yang komit hadir |
| `hadir` | jumlah yang benar-benar check-in |
| `rencana_jadi` | Y jika terlaksana dengan **>= 3 hadir** |
| `peserta_ulang` | dari peserta ini, berapa yang ikut rencana ke-2 |
| `peserta_jadi_host` | berapa peserta yang lalu **bikin** rencana sendiri |
| `catatan` | alasan batal / no-show, dll. |

## Metrik & ambang

| Metrik | Rumus | PASS |
| --- | --- | ---: |
| Aktivasi host | host unik dgn >=1 rencana / 8 | >= 5/8 |
| Respons voting/RSVP | SUM(vote_masuk) / SUM(undangan_terkirim) | >= 40% |
| Rencana jadi | COUNT(rencana_jadi=Y) / COUNT(baris) | >= 50% |
| Kehadiran | SUM(hadir) / SUM(rsvp_ya) | >= 60% |
| Repeat participant | SUM(peserta_ulang) / peserta unik | >= 30% |
| Peserta -> host | SUM(peserta_jadi_host) / peserta unik | >= 25% |

Contoh formula Google Sheets (baris data mulai dari 2):

- Rencana jadi: `=COUNTIF(K2:K, "Y") / COUNTA(A2:A)`
- Kehadiran: `=SUM(J2:J) / SUM(I2:I)`
- Respons: `=SUM(G2:G) / SUM(F2:F)`

## Keputusan

- **GO** — aktivasi, rencana-jadi, dan kehadiran **lulus**, plus minimal **satu** metrik pertumbuhan (repeat atau peserta->host) lulus → bangun MVP tipis (create / vote / lock / RSVP / check-in).
- **ITERATE** — rencana-jadi lulus tapi pertumbuhan gagal → fokus ke kru aktivitas berulang atau alat organisasi kampus.
- **KILL** — aktivasi < 5/8 **atau** rencana-jadi < 50% → hentikan tesis app sosial; masalah / wedge belum cukup kuat.

> Pertanyaan kualitatif wajib di tiap host: **"Tanpa bantuan kami, rencana ini tetap terjadi?"** Jawaban "ya, tetap terjadi" = sinyal WhatsApp saja sudah cukup (waspada).
