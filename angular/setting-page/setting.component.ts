import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Location} from '@angular/common';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Customer} from '../models/customer.model';
import {AppConfigService} from '../services/appConfig.service';
import {SettingService} from '../services/setting.service';
import {NotificationService} from '../services/notification.service';
import {JsonResponse} from '../models/json-response.model';
import {isNullOrUndefined, isUndefined} from 'util';
import {UserProfileService} from '../services/user-profile.service';
import * as moment from 'moment';
import {LocationService} from '../services/location.service';
import {LocationModel} from '../models/location.model';
import {SkillService} from '../services/skill.service';
import {EducationService} from '../services/education.service';
import {Skill} from '../models/skill.model';
import {Education} from '../models/education.model';
import {MemberProfile} from '../models/member-profile.model';
import {MembersService} from '../services/members.service';
import {InterestService} from '../services/interest.service';
import {Interest} from '../models/interest';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'la-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  providers: [SettingService, UserProfileService, Location, LocationService, SkillService, InterestService, EducationService],
  encapsulation: ViewEncapsulation.None
})
export class SettingComponent implements OnInit {
  editProfileForm: FormGroup;
  changePasswordForm: FormGroup;
  userProfileForm: FormGroup;
  // locationForm: FormGroup;
  skillForm: FormGroup;
  interestForm: FormGroup;
  educationForm: FormGroup;
  customer: Customer;
  userLocation: LocationModel;
  memberProfile: MemberProfile = new MemberProfile();
  file: File;
  img = '';
  today = new Date();
  birthDate = null;
  isRemoveLogo = false;
  isLoading = false;
  isDeleting = false;
  ng2TelInputOptions = {initialCountry: 'US'};

  constructor(private formBuilder: FormBuilder,
              private appConfigService: AppConfigService,
              private settingService: SettingService,
              private ns: NotificationService,
              private userProfileService: UserProfileService,
              private router: Router,
              private locationService: LocationService,
              private skillService: SkillService,
              private interestService: InterestService,
              private educationService: EducationService,
              private memberService: MembersService) {
    this.customer = this.appConfigService.customer;
    this.userLocation = this.appConfigService.location;
    this.img = this.customer.photo_url + '?' + Math.random();
    this.getMemberProfile();
  }

  ngOnInit(): void {
    this.initEditProfileForm();
    this.setEditProfileForm();
    this.initUserProfileForm();
    // this.initLocationForm();
    // this.setLocationForm();
    this.initChangePasswordForm();
    this.initSkillForm();
    this.initInterestForm();
    this.initEducationForm();
  }

  initEditProfileForm(): void {
    this.editProfileForm = this.formBuilder.group({
      first_name: [],
      last_name: [],
      phone: [],
      email: [],
      description: [],
      birthday: [],
      twitter_url: [],
      linkedin_url: [],
      designation: [],
      website_url: [],
    });
  }

  setEditProfileForm(): void {
    const profile = {
      first_name: this.customer.first_name,
      last_name: this.customer.last_name,
      phone: this.customer.phone,
      email: this.customer.email,
      description: this.customer.description,
      birthday: null,
      twitter_url: this.customer.twitter_url,
      linkedin_url: this.customer.linkedin_url,
      designation: this.customer.designation,
      website_url: this.customer.website_url,
    };

    if (this.customer.birth_month && this.customer.birth_day && this.customer.birth_year) {
      this.birthDate = new Date(+this.customer.birth_year, +this.customer.birth_month - 1, +this.customer.birth_day);
      profile.birthday = this.birthDate;
    }

    this.editProfileForm.patchValue(profile);
  }

  onDateSelect(date: string): void {
    let dateFormat = null;
    if (!isNullOrUndefined(date)) {
      dateFormat = moment(date).format('MM/DD/YYYY');
    }
    this.editProfileForm.patchValue({
      birthday: dateFormat
    });
  }

  initChangePasswordForm(): void {
    this.changePasswordForm = this.formBuilder.group({
      current_password: ['', Validators.required],
      passwords: this.formBuilder.group({
        password: ['', Validators.minLength(8)],
        confirm_password: [''],
      }, {validator: this.passwordConfirming}),
    });
  }

  passwordConfirming(c: AbstractControl): { invalid: boolean } {
    if (c.get('password').value !== c.get('confirm_password').value) {
      return {invalid: true};
    }
  }

  onEditProfile(profileForm: FormGroup): void {
    const editProfileObj = profileForm.value;
    if (!isNullOrUndefined(this.editProfileForm.get('birthday')) && this.editProfileForm.get('birthday').value) {
      const birthDate = this.editProfileForm.get('birthday').value;
      editProfileObj.birth_day = moment(birthDate, 'MM/DD/YYYY').format('DD');
      editProfileObj.birth_month = moment(birthDate, 'MM/DD/YYYY').format('MM');
      editProfileObj.birth_year = moment(birthDate, 'MM/DD/YYYY').format('YYYY');
    } else {
      editProfileObj.birth_day = null;
      editProfileObj.birth_month = null;
      editProfileObj.birth_year = null;
    }
    if (this.isRemoveLogo) {
      editProfileObj.photo_url = '';
    }
    this.updateUserProfile(editProfileObj);
  }

  onChangePassword(): void {
    const passwords = {
      current_password: this.changePasswordForm.value.current_password,
      update_password: this.changePasswordForm.value.passwords.password,
    };
    this.settingService.changePassword(passwords).subscribe(
        () => {
          this.ns.successNotification('Password updated successfully');
        }, (error: JsonResponse) => {
          this.ns.errorNotification(error.message);
        });
  }

  /***
   * Uploading an user  profile photo
   * @param fileInput
   */
  onFileChange(fileInput: any): void {
    const file = fileInput.target.files[0];
    if (isUndefined(file)) {
      this.img = '';
      this.file = undefined;
      return;
    }
    if (['image/jpeg', 'image/gif', 'image/png'].indexOf(file.type) === -1) {
      this.ns.errorNotification('Only image allowed.');
      return;
    }
    this.file = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.img = e.target.result;
    };
    reader.readAsDataURL(fileInput.target.files[0]);
  }

  /***
   * open a file picker on clicked of profile photo
   */
  onFileSelect(): void {
    document.getElementById('businessLogo').click();
  }

  /***
   * Remove an user profile picture
   */
  onFileRemove(): void {
    if (this.img) {
      this.img = '';
      this.file = undefined;
      this.isRemoveLogo = true;
    }
  }

  initUserProfileForm(): void {
    this.userProfileForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: [],
      phone: [],
      email: [],
      description: [],
      birthday: [],
      twitter_url: [],
      linkedin_url: [],
      designation: [],
      website_url: [],
      location_name: [{value: '', disabled: true}],
    });
  }

  setUserProfileForm(): void {
    const profile = {
      first_name: this.memberProfile.customer.first_name ? this.memberProfile.customer.first_name : '',
      last_name: this.memberProfile.customer.last_name ? this.memberProfile.customer.last_name : '',
      phone: this.memberProfile.customer.phone,
      email: this.memberProfile.customer.email,
      description: this.memberProfile.customer.description,
      birthday: null,
      twitter_url: this.memberProfile.customer.twitter_url,
      linkedin_url: this.memberProfile.customer.linkedin_url,
      designation: this.memberProfile.customer.designation,
      website_url: this.memberProfile.customer.website_url,
      location_name: this.userLocation.name
    };

    if (this.memberProfile.customer.birth_month && this.memberProfile.customer.birth_day && this.memberProfile.customer.birth_year) {
      this.birthDate = new Date(+this.memberProfile.customer.birth_year, +this.memberProfile.customer.birth_month - 1,
          +this.memberProfile.customer.birth_day);
      profile.birthday = this.birthDate;
    }

    this.userProfileForm.patchValue(profile);
  }

  getMemberProfile(): void {
    this.memberService.getMemberPublicProfile(this.appConfigService.customerId).subscribe(
        (memberProfile: MemberProfile) => {
          this.memberProfile = memberProfile;
          this.setUserProfileForm();
        }, () => {
        });
  }

  /***
   * Update user details
   * @param profile
   */
  updateUserProfile(profile: Customer): void {
    this.userProfileService.updateProfile(profile, this.customer.id, this.file).subscribe(
        (customer: Customer) => {
          this.updateCustomerInConfig(customer);
          this.ns.saveSuccessRoundNotification('Profile updated');
        }, (err: HttpErrorResponse) => {
          this.ns.errorNotification(err.error.message);
          this.userProfileForm.get('phone').setErrors([err.error.message, true]);
        });
  }

  /***
   * Determine what user want's to be add on input key stroke
   */
  keyDownFunction(event: KeyboardEvent, state: string, form: FormGroup): void {
    if (event.code === 'Enter') {
      if (state === 'interest') {
        this.onAddInterest(form);
      } else if (state === 'skill') {
        this.onAddSkill(form);
      }
    }
  }

  /***
   * Todo temporary hide do not change location name
   * Update user location detail
   * @param {LocationModel} userLocation
   */
  // updateUserLocation(userLocation: LocationModel): void {
  //   this.locationService.updateLocation(this.appConfigService.businessId, userLocation, this.userLocation.id)
  //     .subscribe((loc: LocationModel) => {
  //       this.updateLocationConfig(loc);
  //       this.ns.saveSuccessRoundNotification('location updated');
  //     });
  // }

  onAddSkill(skillForm: FormGroup): void {
    this.skillService.addSkill(skillForm.value).subscribe(
        (skill: Skill) => {
          this.memberProfile.customer.skills.push(skill);
          this.skillForm.reset();
          this.ns.saveSuccessRoundNotification('Skill Added');
        }, err => {
          this.ns.errorNotification(err.message);
        });
  }

  onRemoveSkill(id: number): void {
    this.isDeleting = true;
    this.skillService.removeSkill(id).subscribe(
        () => {
          this.memberProfile.customer.skills = this.memberProfile.customer.skills.filter(skill => skill.id !== id);
          this.ns.saveSuccessRoundNotification('Skill Removed');
          this.isDeleting = false;
        }, err => {
          this.ns.errorNotification(err.message);
        });
  }

  onAddInterest(interestForm: FormGroup): void {
    this.interestService.addInterest(interestForm.value).subscribe(
        (interest: Interest) => {
          this.memberProfile.customer.interests.push(interest);
          this.interestForm.reset();
          this.ns.saveSuccessRoundNotification('Interest Added');
        }, err => {
          this.ns.errorNotification(err.message);
        });
  }

  onRemoveInterest(id: number): void {
    this.isDeleting = true;
    this.interestService.removeInterest(id).subscribe(
        () => {
          this.memberProfile.customer.interests = this.memberProfile.customer.interests.filter(interest => interest.id !== id);
          this.ns.saveSuccessRoundNotification('Interest Removed');
          this.isDeleting = false;
        }, err => {
          this.ns.errorNotification(err.message);
        });
  }

  onAddEducation(eduForm: FormGroup): void {
    this.educationService.addEducation(eduForm.value).subscribe(
        (education: Education) => {
          this.memberProfile.customer.educations.push(education);
          this.educationForm.reset();
          this.ns.saveSuccessRoundNotification('Education Added');
        }, err => {
          this.ns.errorNotification(err.message);
        });
  }

  onRemoveEducation(id: number): void {
    this.isDeleting = true;
    this.educationService.removeEducation(id).subscribe(
        () => {
          this.memberProfile.customer.educations = this.memberProfile.customer.educations.filter(edu => edu.id !== id);
          this.ns.saveSuccessRoundNotification('Education Removed');
          this.isDeleting = false;
        }, err => {
          this.ns.errorNotification(err.message);
        });
  }

  numberOnly(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    let isNumber = true;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 43) {
      isNumber = false;
    }
    return isNumber;
  }

  hasError(hasError: boolean): void {
    if (!hasError && this.userProfileForm.value.phone !== '') {
      this.userProfileForm.get('phone').setErrors(['invalid_cell_phone', true]);
    }
  }

  private updateCustomerInConfig(customer: Customer): void {
    this.appConfigService.config.customer.first_name = customer.first_name;
    this.appConfigService.config.customer.last_name = customer.last_name;
    this.appConfigService.config.customer.phone = customer.phone;
    this.appConfigService.config.customer.email = customer.email;
    this.appConfigService.config.customer.description = customer.description;
    this.appConfigService.config.customer.twitter_url = customer.twitter_url;
    this.appConfigService.config.customer.linkedin_url = customer.linkedin_url;
    this.appConfigService.config.customer.designation = customer.designation;
    this.appConfigService.config.customer.website_url = customer.website_url;
    this.appConfigService.config.customer.birth_day = customer.birth_day;
    this.appConfigService.config.customer.birth_month = customer.birth_month;
    this.appConfigService.config.customer.birth_year = customer.birth_year;
    this.appConfigService.config.customer.photo_url = customer.photo_url + '?' + Math.random();
  }

  /***
   * Update user location detail in user config
   * @param {LocationModel} userLocation
   */
  // updateLocationConfig(userLocation: LocationModel): void {
  //   this.appConfigService.location.name = userLocation.name;
  // }

  private initSkillForm(): void {
    this.skillForm = this.formBuilder.group(
        {
          name: ['', [Validators.required]]
        });
  }

  private initInterestForm(): void {
    this.interestForm = this.formBuilder.group(
        {
          name: ['', [Validators.required]]
        });
  }

  private initEducationForm(): void {
    this.educationForm = this.formBuilder.group({
      school_name: ['', Validators.required],
      degree: ['', Validators.required],
      passing_year: ['', Validators.compose([Validators.required,
        Validators.min(1000), Validators.max(9999)])]
    });
  }
}
